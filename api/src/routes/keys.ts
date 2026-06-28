/**
 * API Keys Management Routes (authenticated)
 *
 * GET    /api/keys       — list my keys (no full key)
 * POST   /api/keys       — create a new key (returns full key once)
 * DELETE /api/keys/:id   — revoke a key
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "@oura-pix/database";
import { getUser } from "../middleware/auth";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
} from "../services/apiKeyService";
import { apiMessage } from "../lib/i18n";

const keys = new Hono<{
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
  };
}>();

/**
 * GET /api/keys
 * List current user's keys
 */
keys.get("/", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  try {
    const db = createDb(c.env.DB);
    const records = await listApiKeys(db, user.id);
    return c.json({
      success: true,
      data: records.map((r) => ({
        id: r.id,
        name: r.name,
        keyPrefix: r.keyPrefix,
        lastUsedAt: r.lastUsedAt,
        expiresAt: r.expiresAt,
        isRevoked: r.isRevoked,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to list api keys:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

const createSchema = z.object({
  name: z.string().min(1).max(100),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

/**
 * POST /api/keys
 * Create a new key. Returns the full key ONLY in this response.
 */
keys.post("/", zValidator("json", createSchema), async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  const input = c.req.valid("json");

  try {
    const db = createDb(c.env.DB);
    const expiresAt = input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;
    const result = await createApiKey(db, user.id, input.name, { expiresAt });
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error("Failed to create api key:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * DELETE /api/keys/:id
 * Revoke a key (soft delete — sets isRevoked = true)
 */
keys.delete("/:id", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const success = await revokeApiKey(db, id, user.id);
    if (!success) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to revoke api key:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * DELETE /api/keys/:id/hard
 * Hard delete a key record entirely
 */
keys.delete("/:id/hard", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const success = await deleteApiKey(db, id, user.id);
    if (!success) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete api key:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

export default keys;
