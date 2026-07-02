/**
 * Metrics Routes
 *
 * API endpoints for performance metrics reporting and dashboard
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "@oura-pix/database";
import {
  recordMetric,
  recordMetrics,
  getDashboardStats,
  getRecentMetrics,
} from "../services/metricService";
import { createRouter } from "../lib/route";

const metrics = createRouter();

const MetricNameSchema = z.enum([
  "LCP",
  "INP",
  "CLS",
  "FCP",
  "TTFB",
  "navigation.domContentLoaded",
  "navigation.load",
]);

const DeviceTypeSchema = z.enum(["mobile", "tablet", "desktop"]);
const RatingSchema = z.enum(["good", "needs-improvement", "poor"]);

const singleMetricSchema = z.object({
  name: MetricNameSchema,
  value: z.number().finite(),
  rating: RatingSchema.optional(),
  url: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  deviceType: DeviceTypeSchema.optional(),
  connectionType: z.string().max(50).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/metrics
 * Report a single metric (public — client-side)
 */
metrics.post("/", zValidator("json", singleMetricSchema), async (c) => {
  const input = c.req.valid("json");
  const db = createDb(c.env.DB);
  const record = await recordMetric(db, input);
  return c.json({ success: true, data: { id: record.id } });
});

const batchMetricSchema = z.object({
  metrics: z.array(singleMetricSchema).min(1).max(50),
});

/**
 * POST /api/metrics/batch
 * Report multiple metrics in one call (public — client-side)
 */
metrics.post("/batch", zValidator("json", batchMetricSchema), async (c) => {
  const { metrics: inputs } = c.req.valid("json");
  const db = createDb(c.env.DB);
  const recorded = await recordMetrics(db, inputs);
  return c.json({ success: true, data: { recorded } });
});

/**
 * GET /api/metrics/dashboard
 * Aggregate stats for the dashboard (auth required)
 */
metrics.get("/dashboard", async (c) => {

  const range = c.req.query("range") || "7d";
  const startDate = rangeToDate(range);
  const db = createDb(c.env.DB);
  const stats = await getDashboardStats(db, startDate);
  return c.json({ success: true, data: stats });
});

/**
 * GET /api/metrics/:name
 * Recent data points for a specific metric (auth required)
 */
metrics.get("/:name", async (c) => {

  const name = c.req.param("name");
  const range = c.req.query("range") || "7d";
  const startDate = rangeToDate(range);
  const limit = Math.min(Number(c.req.query("limit")) || 50, 200);

  const db = createDb(c.env.DB);
  const recent = await getRecentMetrics(db, name, startDate, limit);
  return c.json({ success: true, data: { name, points: recent } });
});

function rangeToDate(range: string): Date {
  const now = Date.now();
  switch (range) {
    case "1h":
      return new Date(now - 60 * 60 * 1000);
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
}

export default metrics;
