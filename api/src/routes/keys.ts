/**
 * API Keys Management Routes (authenticated)
 *
 * GET    /api/keys       — list my keys (no full key)
 * POST   /api/keys       — create a new key (returns full key once)
 * DELETE /api/keys/:id   — revoke a key
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createRouter, useCtx } from "../lib/route";
import { notFound } from "../lib/http";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  deleteApiKey,
} from "../services/apiKeyService";

const keys = createRouter();

/**
 * GET /api/keys
 * List current user's keys
 */
keys.get("/", async (c) => {
  const { user, db } = useCtx(c);

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
  const { user, db } = useCtx(c);

  const input = c.req.valid("json");
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;
  const result = await createApiKey(db, user.id, input.name, { expiresAt });
  return c.json({ success: true, data: result });
});

/**
 * DELETE /api/keys/:id
 * Revoke a key (soft delete — sets isRevoked = true)
 */
keys.delete("/:id", async (c) => {
  const { user, db } = useCtx(c);

  const id = c.req.param("id");
  const success = await revokeApiKey(db, id, user.id);
  if (!success) return notFound(c);
  return c.json({ success: true });
});

/**
 * DELETE /api/keys/:id/hard
 * Hard delete a key record entirely
 */
keys.delete("/:id/hard", async (c) => {
  const { user, db } = useCtx(c);

  const id = c.req.param("id");
  const success = await deleteApiKey(db, id, user.id);
  if (!success) return notFound(c);
  return c.json({ success: true });
});

export default keys;
