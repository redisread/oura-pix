/**
 * Collections Routes
 *
 * Authenticated endpoints for managing favorites collections.
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "@oura-pix/database";
import { getUser } from "../middleware/auth";
import {
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  moveFavoriteToCollection,
} from "../services/collectionService";
import { apiMessage } from "../lib/i18n";

const collections = new Hono<{
  Bindings: { DB: D1Database };
  Variables: { user: { id: string; email: string; name?: string | null }; session: { id: string; expiresAt: Date } };
}>();

const createSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().max(200).optional(),
});

const updateSchema = createSchema.partial();

/**
 * GET /api/collections — list user's collections (with item counts)
 */
collections.get("/", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  try {
    const db = createDb(c.env.DB);
    const data = await listCollections(db, user.id);
    return c.json({ success: true, data });
  } catch (error) {
    console.error("Failed to list collections:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * POST /api/collections — create
 */
collections.post("/", zValidator("json", createSchema), async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  const input = c.req.valid("json");
  try {
    const db = createDb(c.env.DB);
    const created = await createCollection(db, user.id, input);
    return c.json({ success: true, data: created }, 201);
  } catch (error) {
    console.error("Failed to create collection:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * PATCH /api/collections/:id — update
 */
collections.patch("/:id", zValidator("json", updateSchema), async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  const id = c.req.param("id");
  const input = c.req.valid("json");
  try {
    const db = createDb(c.env.DB);
    const updated = await updateCollection(db, id, user.id, input);
    if (!updated) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error("Failed to update collection:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * DELETE /api/collections/:id — delete (favorites move to uncategorized via SET NULL)
 */
collections.delete("/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  const id = c.req.param("id");
  try {
    const db = createDb(c.env.DB);
    const ok = await deleteCollection(db, id, user.id);
    if (!ok) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete collection:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * PUT /api/collections/:id/favorites/:favoriteId
 * Move a favorite to a collection (or null to remove from collection)
 */
const moveSchema = z.object({
  collectionId: z.string().nullable(),
});

collections.put("/:id/favorites/:favoriteId", zValidator("json", moveSchema), async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  const favoriteId = c.req.param("favoriteId");
  const { collectionId } = c.req.valid("json");
  try {
    const db = createDb(c.env.DB);
    const ok = await moveFavoriteToCollection(db, favoriteId, user.id, collectionId);
    if (!ok) return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to move favorite:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

export default collections;
