/**
 * Collections Routes
 *
 * Authenticated endpoints for managing favorites collections.
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createRouter, useCtx } from "../lib/route";
import { notFound } from "../lib/http";
import {
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
  moveFavoriteToCollection,
} from "../services/collectionService";

const collections = createRouter();

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
  const { user, db } = useCtx(c);
  const data = await listCollections(db, user.id);
  return c.json({ success: true, data });
});

/**
 * POST /api/collections — create
 */
collections.post("/", zValidator("json", createSchema), async (c) => {
  const { user, db } = useCtx(c);
  const input = c.req.valid("json");
  const created = await createCollection(db, user.id, input);
  return c.json({ success: true, data: created }, 201);
});

/**
 * PATCH /api/collections/:id — update
 */
collections.patch("/:id", zValidator("json", updateSchema), async (c) => {
  const { user, db } = useCtx(c);
  const id = c.req.param("id");
  const input = c.req.valid("json");
  const updated = await updateCollection(db, id, user.id, input);
  if (!updated) return notFound(c);
  return c.json({ success: true, data: updated });
});

/**
 * DELETE /api/collections/:id — delete (favorites move to uncategorized via SET NULL)
 */
collections.delete("/:id", async (c) => {
  const { user, db } = useCtx(c);
  const id = c.req.param("id");
  const ok = await deleteCollection(db, id, user.id);
  if (!ok) return notFound(c);
  return c.json({ success: true });
});

/**
 * PUT /api/collections/:id/favorites/:favoriteId
 * Move a favorite to a collection (or null to remove from collection)
 */
const moveSchema = z.object({
  collectionId: z.string().nullable(),
});

collections.put("/:id/favorites/:favoriteId", zValidator("json", moveSchema), async (c) => {
  const { user, db } = useCtx(c);
  const favoriteId = c.req.param("favoriteId");
  const { collectionId } = c.req.valid("json");
  const ok = await moveFavoriteToCollection(db, favoriteId, user.id, collectionId);
  if (!ok) return notFound(c);
  return c.json({ success: true });
});

export default collections;
