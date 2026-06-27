/**
 * Feedback Routes
 *
 * - POST /api/feedback (auth) — submit feedback for a generation
 * - GET  /api/feedback/stats?generationId= (auth) — aggregated stats for a generation
 * - GET  /api/feedback?generationId= (auth) — list feedback for a generation
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb, schema } from "@oura-pix/database";
import { eq, and, count, avg, desc } from "drizzle-orm";
import { getUser } from "../middleware/auth";

const feedback = new Hono<{
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
  };
}>();

const submitSchema = z.object({
  generationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

/**
 * POST /api/feedback
 * Submit feedback for a generation
 */
feedback.post("/", zValidator("json", submitSchema), async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, 401);

  const input = c.req.valid("json");

  try {
    const db = createDb(c.env.DB);

    // Verify the generation belongs to this user
    const gen = await db
      .select({ id: schema.generations.id })
      .from(schema.generations)
      .where(and(eq(schema.generations.id, input.generationId), eq(schema.generations.userId, user.id)))
      .limit(1);
    if (gen.length === 0) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: "Generation not found" } }, 404);
    }

    const [created] = await db
      .insert(schema.feedback)
      .values({
        id: crypto.randomUUID(),
        generationId: input.generationId,
        userId: user.id,
        rating: input.rating,
        comment: input.comment ?? null,
        createdAt: new Date(),
      })
      .returning();

    return c.json({ success: true, data: { id: created!.id } }, 201);
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to submit feedback" } }, 500);
  }
});

/**
 * GET /api/feedback?generationId=xxx
 * List feedback for a specific generation
 */
feedback.get("/", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, 401);

  const generationId = c.req.query("generationId");
  if (!generationId) return c.json({ success: false, error: { code: "BAD_REQUEST", message: "generationId is required" } }, 400);

  try {
    const db = createDb(c.env.DB);
    // Verify ownership
    const gen = await db
      .select({ id: schema.generations.id })
      .from(schema.generations)
      .where(and(eq(schema.generations.id, generationId), eq(schema.generations.userId, user.id)))
      .limit(1);
    if (gen.length === 0) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: "Generation not found" } }, 404);
    }

    const rows = await db
      .select()
      .from(schema.feedback)
      .where(eq(schema.feedback.generationId, generationId))
      .orderBy(desc(schema.feedback.createdAt));

    return c.json({ success: true, data: rows });
  } catch (error) {
    console.error("Failed to list feedback:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list feedback" } }, 500);
  }
});

/**
 * GET /api/feedback/stats?generationId=xxx
 * Aggregated stats: count + avg rating
 */
feedback.get("/stats", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, 401);

  const generationId = c.req.query("generationId");
  if (!generationId) return c.json({ success: false, error: { code: "BAD_REQUEST", message: "generationId is required" } }, 400);

  try {
    const db = createDb(c.env.DB);
    const gen = await db
      .select({ id: schema.generations.id })
      .from(schema.generations)
      .where(and(eq(schema.generations.id, generationId), eq(schema.generations.userId, user.id)))
      .limit(1);
    if (gen.length === 0) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: "Generation not found" } }, 404);
    }

    const [agg] = await db
      .select({
        count: count(),
        avgRating: avg(schema.feedback.rating),
      })
      .from(schema.feedback)
      .where(eq(schema.feedback.generationId, generationId));

    return c.json({
      success: true,
      data: {
        generationId,
        count: agg?.count ?? 0,
        avgRating: agg?.avgRating ? Number(agg.avgRating) : null,
      },
    });
  } catch (error) {
    console.error("Failed to get feedback stats:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to get feedback stats" } }, 500);
  }
});

export default feedback;
