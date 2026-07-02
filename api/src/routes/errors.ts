/**
 * Errors Routes
 *
 * API endpoints for error reporting and dashboard
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "@oura-pix/database";
import type { ErrorSeverityType, ErrorTypeType, ErrorModuleType } from "@oura-pix/database";
import {
  reportError,
  listErrors,
  getErrorStats,
  deleteError,
  deleteErrors,
} from "../services/errorService";
import { createRouter } from "../lib/route";
import { notFound } from "../lib/http";

const errors = createRouter();

const ErrorSeverityEnum = z.enum(["critical", "high", "medium", "low"]);
const ErrorTypeEnum = z.enum([
  "network",
  "validation",
  "authentication",
  "business_logic",
  "runtime",
  "unknown",
]);
const ErrorModuleEnum = z.enum(["api", "frontend", "worker", "database"]);

/**
 * POST /api/errors
 * Report a new error (public — used by client-side error handlers)
 */
const reportSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(4000).optional(),
  severity: ErrorSeverityEnum.optional(),
  type: ErrorTypeEnum.optional(),
  module: ErrorModuleEnum.optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

errors.post("/", zValidator("json", reportSchema), async (c) => {
  const input = c.req.valid("json");
  const db = createDb(c.env.DB);
  const result = await reportError(db, {
    ...input,
    module: (input.module ?? "frontend") as ErrorModuleType,
  });
  return c.json({
    success: true,
    data: {
      id: result.record.id,
      occurrences: result.record.occurrences,
      created: result.created,
    },
  });
});

/**
 * GET /api/errors
 * List errors with filters (requires auth)
 */
errors.get("/", async (c) => {

  const page = Number(c.req.query("page")) || 1;
  const pageSize = Math.min(Number(c.req.query("pageSize")) || 20, 100);
  const severity = c.req.query("severity") as ErrorSeverityType | undefined;
  const type = c.req.query("type") as ErrorTypeType | undefined;
  const module = c.req.query("module") as ErrorModuleType | undefined;
  const startDateStr = c.req.query("startDate");
  const endDateStr = c.req.query("endDate");

  const db = createDb(c.env.DB);
  const result = await listErrors(db, {
    page,
    pageSize,
    severity,
    type,
    module,
    startDate: startDateStr ? new Date(Number(startDateStr)) : undefined,
    endDate: endDateStr ? new Date(Number(endDateStr)) : undefined,
  });
  return c.json({ success: true, data: result });
});

/**
 * GET /api/errors/stats
 * Get aggregate stats for dashboard
 */
errors.get("/stats", async (c) => {

  const rangeStr = c.req.query("range") || "7d";
  const days = rangeStr === "24h" ? 1 : rangeStr === "7d" ? 7 : rangeStr === "30d" ? 30 : 7;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const db = createDb(c.env.DB);
  const stats = await getErrorStats(db, startDate);
  return c.json({ success: true, data: stats });
});

/**
 * DELETE /api/errors/:id
 * Delete a single error
 */
errors.delete("/:id", async (c) => {

  const id = c.req.param("id");
  const db = createDb(c.env.DB);
  const success = await deleteError(db, id);
  if (!success) return notFound(c);
  return c.json({ success: true });
});

/**
 * POST /api/errors/batch-delete
 * Bulk delete errors
 */
const batchDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

errors.post("/batch-delete", zValidator("json", batchDeleteSchema), async (c) => {

  const { ids } = c.req.valid("json");
  const db = createDb(c.env.DB);
  const deleted = await deleteErrors(db, ids);
  return c.json({ success: true, data: { deleted } });
});

export default errors;
