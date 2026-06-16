/**
 * API Key Authentication Middleware
 *
 * Validates "Authorization: Bearer op_xxx" against the api_keys table.
 * On success, attaches { apiKey, user } to context.
 *
 * Use this for /api/v1/* public API endpoints.
 */

import { createMiddleware } from "hono/factory";
import { createDb, schema, type User as DBUser } from "@oura-pix/database";
import { eq } from "drizzle-orm";
import { validateApiKey } from "../services/apiKeyService";

export type ApiKeyContext = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    apiKey: {
      id: string;
      userId: string;
      name: string;
    };
    apiKeyUser: DBUser;
  };
};

export const apiKeyAuth = createMiddleware<ApiKeyContext>(async (c, next) => {
  const authHeader = c.req.header("Authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(op_[a-f0-9]{64})$/i);
  if (!match) {
    return c.json({ error: "Missing or malformed API key. Use: Authorization: Bearer op_xxx" }, 401);
  }

  const key = match[1];
  const db = createDb(c.env.DB);
  const record = await validateApiKey(db, key);
  if (!record) {
    return c.json({ error: "Invalid or revoked API key" }, 401);
  }

  // Load the user record
  const users = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, record.userId))
    .limit(1);

  if (users.length === 0) {
    return c.json({ error: "API key owner not found" }, 401);
  }

  c.set("apiKey", { id: record.id, userId: record.userId, name: record.name });
  c.set("apiKeyUser", users[0]);

  await next();
});
