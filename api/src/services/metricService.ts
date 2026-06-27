/**
 * Metrics Service
 *
 * Handles performance metric recording, aggregation, and retrieval
 */

import { createDb, schema } from "@oura-pix/database";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import type { MetricNameType } from "@oura-pix/database";

export type Rating = "good" | "needs-improvement" | "poor";

export interface RecordMetricInput {
  name: MetricNameType | string;
  value: number;
  rating?: Rating;
  url?: string;
  userAgent?: string;
  deviceType?: "mobile" | "tablet" | "desktop";
  connectionType?: string;
  context?: Record<string, unknown>;
}

export interface MetricRecord {
  id: string;
  name: string;
  value: number;
  rating: Rating | null;
  url: string | null;
  userAgent: string | null;
  deviceType: "mobile" | "tablet" | "desktop" | null;
  connectionType: string | null;
  context: string | null;
  recordedAt: Date;
}

export interface MetricSummary {
  name: string;
  count: number;
  p50: number;
  p95: number;
  avg: number;
  goodPct: number;
  poorPct: number;
}

/**
 * Record a single metric data point
 */
export async function recordMetric(
  db: ReturnType<typeof createDb>,
  input: RecordMetricInput
): Promise<MetricRecord> {
  const [created] = await db
    .insert(schema.metrics)
    .values({
      id: crypto.randomUUID(),
      name: input.name,
      value: input.value,
      rating: input.rating ?? null,
      url: input.url?.slice(0, 500) ?? null,
      userAgent: input.userAgent?.slice(0, 500) ?? null,
      deviceType: input.deviceType ?? null,
      connectionType: input.connectionType ?? null,
      context: input.context ? JSON.stringify(input.context).slice(0, 4000) : null,
      recordedAt: new Date(),
    })
    .returning();
  return created!;
}

/**
 * Batch record multiple metrics in one call
 */
export async function recordMetrics(
  db: ReturnType<typeof createDb>,
  inputs: RecordMetricInput[]
): Promise<number> {
  if (inputs.length === 0) return 0;

  const values = inputs.map((input) => ({
    id: crypto.randomUUID(),
    name: input.name,
    value: input.value,
    rating: input.rating ?? null,
    url: input.url?.slice(0, 500) ?? null,
    userAgent: input.userAgent?.slice(0, 500) ?? null,
    deviceType: input.deviceType ?? null,
    connectionType: input.connectionType ?? null,
    context: input.context ? JSON.stringify(input.context).slice(0, 4000) : null,
    recordedAt: new Date(),
  }));

  const result = await db.insert(schema.metrics).values(values).returning();
  return result.length;
}

/**
 * Compute aggregate stats (P50/P95/avg) for a metric over a date range.
 *
 * Note: SQLite doesn't have native percentile functions; we pull all values
 * and compute in JS. Fine for the modest volumes we expect at this scale.
 */
export async function getMetricSummary(
  db: ReturnType<typeof createDb>,
  name: string,
  startDate: Date
): Promise<MetricSummary | null> {
  const values = await db
    .select({ value: schema.metrics.value, rating: schema.metrics.rating })
    .from(schema.metrics)
    .where(and(eq(schema.metrics.name, name), gte(schema.metrics.recordedAt, startDate)));

  if (values.length === 0) {
    return { name, count: 0, p50: 0, p95: 0, avg: 0, goodPct: 0, poorPct: 0 };
  }

  const sorted = values.map((v) => v.value).sort((a, b) => a - b);
  const total = sorted.length;
  const sum = sorted.reduce((s, v) => s + v, 0);

  const p50 = sorted[Math.floor(total * 0.5)] ?? 0;
  const p95 = sorted[Math.min(total - 1, Math.floor(total * 0.95))] ?? 0;
  const avg = sum / total;

  const good = values.filter((v) => v.rating === "good").length;
  const poor = values.filter((v) => v.rating === "poor").length;

  return {
    name,
    count: total,
    p50: roundTo(p50, 2),
    p95: roundTo(p95, 2),
    avg: roundTo(avg, 2),
    goodPct: roundTo((good / total) * 100, 1),
    poorPct: roundTo((poor / total) * 100, 1),
  };
}

/**
 * Get summaries for all core web vitals
 */
export async function getDashboardStats(
  db: ReturnType<typeof createDb>,
  startDate: Date
): Promise<{ range: string; metrics: MetricSummary[] }> {
  const coreNames = ["LCP", "INP", "CLS", "FCP", "TTFB"];
  const summaries = await Promise.all(
    coreNames.map((name) => getMetricSummary(db, name, startDate))
  );
  return {
    range: startDate.toISOString(),
    metrics: summaries.filter((s): s is MetricSummary => s !== null),
  };
}

/**
 * Get recent data points for trend display
 */
export async function getRecentMetrics(
  db: ReturnType<typeof createDb>,
  name: string,
  startDate: Date,
  limit = 50
): Promise<MetricRecord[]> {
  return db
    .select()
    .from(schema.metrics)
    .where(and(eq(schema.metrics.name, name), gte(schema.metrics.recordedAt, startDate)))
    .orderBy(desc(schema.metrics.recordedAt))
    .limit(limit);
}

/**
 * Delete metrics older than a cutoff (cleanup job).
 * Returns the number of rows deleted.
 */
export async function deleteOldMetrics(
  db: ReturnType<typeof createDb>,
  cutoff: Date
): Promise<number> {
  const result = await db
    .delete(schema.metrics)
    .where(sql`${schema.metrics.recordedAt} < ${cutoff.getTime()}`)
    .returning();
  return result.length;
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
