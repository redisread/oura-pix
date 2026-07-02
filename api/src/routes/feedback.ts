/**
 * Feedback Routes
 *
 * - POST /api/feedback (auth) — submit feedback for a generation
 * - GET  /api/feedback/stats?generationId= (auth) — aggregated stats for a generation
 * - GET  /api/feedback?generationId= (auth) — list feedback for a generation
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb, schema } from "@oura-pix/database";
import { eq, and, count, avg, desc } from "drizzle-orm";
import { createRouter, useCtx } from "../lib/route";
import { badRequest, notFound } from "../lib/http";

async function verifyGenerationOwnership(
  db: ReturnType<typeof createDb>,
  generationId: string,
  userId: string
): Promise<boolean> {
  const [gen] = await db
    .select({ id: schema.generations.id })
    .from(schema.generations)
    .where(and(eq(schema.generations.id, generationId), eq(schema.generations.userId, userId)))
    .limit(1);
  return gen !== undefined;
}

const feedback = createRouter();

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
  const { user, db } = useCtx(c);

  const input = c.req.valid("json");

  if (!(await verifyGenerationOwnership(db, input.generationId, user.id))) {
    return notFound(c, "generationNotFound");
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
});

/**
 * GET /api/feedback?generationId=xxx
 * List feedback for a specific generation
 */
feedback.get("/", async (c) => {
  const { user, db } = useCtx(c);

  const generationId = c.req.query("generationId");
  if (!generationId) return badRequest(c);

  if (!(await verifyGenerationOwnership(db, generationId, user.id))) {
    return notFound(c, "generationNotFound");
  }

  const rows = await db
    .select()
    .from(schema.feedback)
    .where(eq(schema.feedback.generationId, generationId))
    .orderBy(desc(schema.feedback.createdAt));

  return c.json({ success: true, data: rows });
});

/**
 * GET /api/feedback/stats?generationId=xxx
 * Aggregated stats: count + avg rating
 */
feedback.get("/stats", async (c) => {
  const { user, db } = useCtx(c);

  const generationId = c.req.query("generationId");
  if (!generationId) return badRequest(c);

  if (!(await verifyGenerationOwnership(db, generationId, user.id))) {
    return notFound(c, "generationNotFound");
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
});

export default feedback;
