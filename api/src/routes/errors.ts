/**
 * Errors Routes
 *
 * API endpoints for error reporting and dashboard
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "@oura-pix/database";
import type { ErrorSeverityType, ErrorTypeType, ErrorModuleType } from "@oura-pix/database";
import { getUser } from "../middleware/auth";
import {
  reportError,
  listErrors,
  getErrorStats,
  deleteError,
  deleteErrors,
} from "../services/errorService";
import { apiMessage } from "../lib/i18n";

const errors = new Hono<{
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
  };
}>();

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

  try {
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
  } catch (error) {
    console.error("Failed to report error:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * GET /api/errors
 * List errors with filters (requires auth)
 */
errors.get("/", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  const page = Number(c.req.query("page")) || 1;
  const pageSize = Math.min(Number(c.req.query("pageSize")) || 20, 100);
  const severity = c.req.query("severity") as ErrorSeverityType | undefined;
  const type = c.req.query("type") as ErrorTypeType | undefined;
  const module = c.req.query("module") as ErrorModuleType | undefined;
  const startDateStr = c.req.query("startDate");
  const endDateStr = c.req.query("endDate");

  try {
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
  } catch (error) {
    console.error("Failed to list errors:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * GET /api/errors/stats
 * Get aggregate stats for dashboard
 */
errors.get("/stats", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  const rangeStr = c.req.query("range") || "7d";
  const days = rangeStr === "24h" ? 1 : rangeStr === "7d" ? 7 : rangeStr === "30d" ? 30 : 7;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const db = createDb(c.env.DB);
    const stats = await getErrorStats(db, startDate);
    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error("Failed to get error stats:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * DELETE /api/errors/:id
 * Delete a single error
 */
errors.delete("/:id", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const success = await deleteError(db, id);
    if (!success) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete error:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * POST /api/errors/batch-delete
 * Bulk delete errors
 */
const batchDeleteSchema = z.object({
  ids: z.array(z.string()).min(1),
});

errors.post("/batch-delete", zValidator("json", batchDeleteSchema), async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  const { ids } = c.req.valid("json");

  try {
    const db = createDb(c.env.DB);
    const deleted = await deleteErrors(db, ids);
    return c.json({ success: true, data: { deleted } });
  } catch (error) {
    console.error("Failed to batch delete errors:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

export default errors;
