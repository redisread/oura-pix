/**
 * Errors Service
 *
 * Handles error recording, aggregation, and retrieval
 */

import { createDb, schema } from "@oura-pix/database";
import { eq, and, gte, desc, sql, count, inArray } from "drizzle-orm";
import type { ErrorSeverityType, ErrorTypeType, ErrorModuleType } from "@oura-pix/database";

export interface ReportErrorInput {
  message: string;
  stack?: string;
  severity?: ErrorSeverityType;
  type?: ErrorTypeType;
  module?: ErrorModuleType;
  context?: Record<string, unknown>;
}

export interface ErrorRecord {
  id: string;
  message: string;
  stack: string | null;
  severity: ErrorSeverityType;
  type: ErrorTypeType;
  module: ErrorModuleType;
  context: string | null;
  hash: string;
  occurrences: number;
  lastSeenAt: Date;
  createdAt: Date;
}

export interface ErrorListParams {
  page?: number;
  pageSize?: number;
  severity?: ErrorSeverityType;
  type?: ErrorTypeType;
  module?: ErrorModuleType;
  startDate?: Date;
  endDate?: Date;
}

export interface ErrorListResponse {
  data: ErrorRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Compute a stable hash for an error to enable deduplication.
 * Uses first 200 chars of message + first 3 stack lines.
 */
export function computeErrorHash(message: string, stack?: string | null): string {
  const normalizedMessage = (message || "").slice(0, 200);
  const normalizedStack = (stack || "")
    .split("\n")
    .slice(0, 3)
    .map((line) => line.trim())
    .join("|");
  return simpleHash(`${normalizedMessage}::${normalizedStack}`);
}

/**
 * Simple djb2 string hash, base36 encoded.
 * Not cryptographic; just stable for dedup keys.
 */
function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

/**
 * Report a new error or increment occurrences of an existing one.
 * Returns the resulting record (new or updated).
 */
export async function reportError(
  db: ReturnType<typeof createDb>,
  input: ReportErrorInput
): Promise<{ record: ErrorRecord; created: boolean }> {
  const hash = computeErrorHash(input.message, input.stack);

  // Try to find an existing error with the same hash (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const existing = await db
    .select()
    .from(schema.errors)
    .where(and(eq(schema.errors.hash, hash), gte(schema.errors.lastSeenAt, sevenDaysAgo)))
    .limit(1);

  if (existing.length > 0) {
    // Update occurrences and lastSeenAt
    const [updated] = await db
      .update(schema.errors)
      .set({
        occurrences: sql`${schema.errors.occurrences} + 1`,
        lastSeenAt: new Date(),
        // Update message in case the latest occurrence has more context
        message: input.message.slice(0, 2000),
        stack: input.stack?.slice(0, 4000) ?? existing[0].stack,
        context: input.context ? JSON.stringify(input.context).slice(0, 8000) : existing[0].context,
      })
      .where(eq(schema.errors.id, existing[0].id))
      .returning();
    return { record: updated, created: false };
  }

  // Create a new record
  const [created] = await db
    .insert(schema.errors)
    .values({
      id: crypto.randomUUID(),
      message: input.message.slice(0, 2000),
      stack: input.stack?.slice(0, 4000) ?? null,
      severity: input.severity ?? "medium",
      type: input.type ?? "unknown",
      module: input.module ?? "frontend",
      context: input.context ? JSON.stringify(input.context).slice(0, 8000) : null,
      hash,
      occurrences: 1,
      lastSeenAt: new Date(),
      createdAt: new Date(),
    })
    .returning();
  return { record: created, created: true };
}

/**
 * List errors with filters and pagination
 */
export async function listErrors(
  db: ReturnType<typeof createDb>,
  params: ErrorListParams = {}
): Promise<ErrorListResponse> {
  const { page = 1, pageSize = 20, severity, type, module, startDate, endDate } = params;

  const conditions = [];
  if (severity) conditions.push(eq(schema.errors.severity, severity));
  if (type) conditions.push(eq(schema.errors.type, type));
  if (module) conditions.push(eq(schema.errors.module, module));
  if (startDate) conditions.push(gte(schema.errors.createdAt, startDate));
  if (endDate) conditions.push(sql`${schema.errors.createdAt} <= ${endDate.getTime()}`);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const totalResult = await db
    .select({ value: count() })
    .from(schema.errors)
    .where(whereClause);

  const total = totalResult[0]?.value ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const data = await db
    .select()
    .from(schema.errors)
    .where(whereClause)
    .orderBy(desc(schema.errors.lastSeenAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    data,
    pagination: { page, pageSize, total, totalPages },
  };
}

/**
 * Get aggregate stats for the dashboard
 */
export async function getErrorStats(
  db: ReturnType<typeof createDb>,
  startDate?: Date
): Promise<{
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  topErrors: ErrorRecord[];
}> {
  const whereClause = startDate ? gte(schema.errors.createdAt, startDate) : undefined;

  const totalResult = await db
    .select({ value: count() })
    .from(schema.errors)
    .where(whereClause);

  const severityResult = await db
    .select({ severity: schema.errors.severity, value: count() })
    .from(schema.errors)
    .where(whereClause)
    .groupBy(schema.errors.severity);

  const typeResult = await db
    .select({ type: schema.errors.type, value: count() })
    .from(schema.errors)
    .where(whereClause)
    .groupBy(schema.errors.type);

  const topErrors = await db
    .select()
    .from(schema.errors)
    .where(whereClause)
    .orderBy(desc(schema.errors.occurrences))
    .limit(10);

  return {
    total: totalResult[0]?.value ?? 0,
    bySeverity: Object.fromEntries(severityResult.map((r) => [r.severity, r.value])),
    byType: Object.fromEntries(typeResult.map((r) => [r.type, r.value])),
    topErrors,
  };
}

/**
 * Delete a single error by id
 */
export async function deleteError(
  db: ReturnType<typeof createDb>,
  id: string
): Promise<boolean> {
  const result = await db
    .delete(schema.errors)
    .where(eq(schema.errors.id, id))
    .returning();
  return result.length > 0;
}

/**
 * Bulk delete errors by ids
 */
export async function deleteErrors(
  db: ReturnType<typeof createDb>,
  ids: string[]
): Promise<number> {
  if (ids.length === 0) return 0;
  const result = await db
    .delete(schema.errors)
    .where(inArray(schema.errors.id, ids))
    .returning();
  return result.length;
}
