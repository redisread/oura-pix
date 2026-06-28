/**
 * Competitors Routes
 *
 * Manual tracking of competitor products. P0: CRUD only.
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb, schema } from "@oura-pix/database";
import { eq, and, desc } from "drizzle-orm";
import { getUser } from "../middleware/auth";
import { apiMessage } from "../lib/i18n";

const competitors = new Hono<{
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
  };
}>();

const PLATFORMS = ["amazon", "shopify", "etsy", "ebay", "taobao", "jd", "tmall", "self", "other"] as const;

const createSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url().max(2000),
  platform: z.enum(PLATFORMS).default("other"),
  notes: z.string().max(2000).nullable().optional(),
  screenshots: z.array(z.string().url()).max(20).optional(),
});

const updateSchema = createSchema.partial();

function parseScreenshots(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function toResponse(row: typeof schema.competitors.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    platform: row.platform,
    notes: row.notes,
    screenshots: parseScreenshots(row.screenshots),
    createdAt: row.createdAt,
  };
}

/**
 * GET /api/competitors
 */
competitors.get("/", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  try {
    const db = createDb(c.env.DB);
    const rows = await db
      .select()
      .from(schema.competitors)
      .where(eq(schema.competitors.userId, user.id))
      .orderBy(desc(schema.competitors.createdAt));
    return c.json({ success: true, data: rows.map(toResponse) });
  } catch (error) {
    console.error("Failed to list competitors:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * POST /api/competitors
 */
competitors.post("/", zValidator("json", createSchema), async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const input = c.req.valid("json");

  try {
    const db = createDb(c.env.DB);
    const [created] = await db
      .insert(schema.competitors)
      .values({
        id: crypto.randomUUID(),
        userId: user.id,
        name: input.name,
        url: input.url,
        platform: input.platform,
        notes: input.notes ?? null,
        screenshots: JSON.stringify(input.screenshots ?? []),
        createdAt: new Date(),
      })
      .returning();
    return c.json({ success: true, data: toResponse(created!) }, 201);
  } catch (error) {
    console.error("Failed to create competitor:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * PUT /api/competitors/:id
 */
competitors.put("/:id", zValidator("json", updateSchema), async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const id = c.req.param("id");
  const input = c.req.valid("json");

  try {
    const db = createDb(c.env.DB);
    const update: Partial<typeof schema.competitors.$inferInsert> = {};
    if (input.name !== undefined) update.name = input.name;
    if (input.url !== undefined) update.url = input.url;
    if (input.platform !== undefined) update.platform = input.platform;
    if (input.notes !== undefined) update.notes = input.notes;
    if (input.screenshots !== undefined) update.screenshots = JSON.stringify(input.screenshots);

    const [updated] = await db
      .update(schema.competitors)
      .set(update)
      .where(and(eq(schema.competitors.id, id), eq(schema.competitors.userId, user.id)))
      .returning();

    if (!updated) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    return c.json({ success: true, data: toResponse(updated) });
  } catch (error) {
    console.error("Failed to update competitor:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * DELETE /api/competitors/:id
 */
competitors.delete("/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);

  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const result = await db
      .delete(schema.competitors)
      .where(and(eq(schema.competitors.id, id), eq(schema.competitors.userId, user.id)))
      .returning();
    if (result.length === 0) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete competitor:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

export default competitors;
