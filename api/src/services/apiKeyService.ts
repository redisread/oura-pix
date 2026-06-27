/**
 * API Key Service
 *
 * Generates, validates, and revokes API keys.
 *
 * Format: op_ + 32 bytes hex = "op_" + 64 hex chars = 67 chars total
 * Storage: SHA-256 hex hash (64 chars) of the full key
 */

import { createDb, schema } from "@oura-pix/database";
import { eq, and, desc } from "drizzle-orm";

const KEY_PREFIX = "op_";
const RANDOM_BYTES = 32;

export interface ApiKeyRecord {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  isRevoked: boolean;
  createdAt: Date;
}

export interface CreateApiKeyResult {
  id: string;
  name: string;
  // The full key — only returned once, at creation time
  key: string;
  keyPrefix: string;
  createdAt: Date;
  expiresAt: Date | null;
}

/**
 * Generate a new API key in the format "op_<64 hex chars>".
 * Uses crypto.getRandomValues via Web Crypto API (available in Workers).
 */
function generateKey(): string {
  const bytes = new Uint8Array(RANDOM_BYTES);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${KEY_PREFIX}${hex}`;
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create a new API key for a user.
 * Returns the full key in `key` — this is the only time it will be available.
 */
export async function createApiKey(
  db: ReturnType<typeof createDb>,
  userId: string,
  name: string,
  options: { expiresAt?: Date } = {}
): Promise<CreateApiKeyResult> {
  const key = generateKey();
  const keyHash = await hashKey(key);
  // Display prefix: first 8 chars of the random hex after "op_"
  const keyPrefix = key.slice(0, 11);

  const [created] = await db
    .insert(schema.apiKeys)
    .values({
      id: crypto.randomUUID(),
      userId,
      name,
      keyPrefix,
      keyHash,
      expiresAt: options.expiresAt ?? null,
      isRevoked: false,
      createdAt: new Date(),
    })
    .returning();

  return {
    id: created!.id,
    name: created!.name,
    key, // full key — caller MUST show to user once
    keyPrefix: created!.keyPrefix,
    createdAt: created!.createdAt,
    expiresAt: created!.expiresAt,
  };
}

/**
 * Validate an incoming API key from the Authorization header.
 * Returns the matching record (with userId) if valid, or null.
 *
 * Side effect: updates lastUsedAt on the matched record.
 */
export async function validateApiKey(
  db: ReturnType<typeof createDb>,
  key: string
): Promise<ApiKeyRecord | null> {
  if (!key.startsWith(KEY_PREFIX)) return null;

  const keyHash = await hashKey(key);
  const records = await db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.keyHash, keyHash))
    .limit(1);

  if (records.length === 0) return null;
  const record = records[0]!;

  if (record.isRevoked) return null;
  if (record.expiresAt && record.expiresAt.getTime() < Date.now()) return null;

  // Fire-and-forget: update lastUsedAt without blocking the request
  db.update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.apiKeys.id, record.id))
    .catch((err) => console.error("Failed to update apiKey.lastUsedAt:", err));

  return record;
}

/**
 * List all keys owned by a user. The full key is never returned.
 */
export async function listApiKeys(
  db: ReturnType<typeof createDb>,
  userId: string
): Promise<ApiKeyRecord[]> {
  return db
    .select()
    .from(schema.apiKeys)
    .where(eq(schema.apiKeys.userId, userId))
    .orderBy(desc(schema.apiKeys.createdAt));
}

/**
 * Revoke a key owned by the user. Idempotent: returns true even if already revoked.
 */
export async function revokeApiKey(
  db: ReturnType<typeof createDb>,
  keyId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .update(schema.apiKeys)
    .set({ isRevoked: true })
    .where(and(eq(schema.apiKeys.id, keyId), eq(schema.apiKeys.userId, userId)))
    .returning();
  return result.length > 0;
}

/**
 * Delete a key record entirely (hard delete). Different from revoke.
 */
export async function deleteApiKey(
  db: ReturnType<typeof createDb>,
  keyId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(schema.apiKeys)
    .where(and(eq(schema.apiKeys.id, keyId), eq(schema.apiKeys.userId, userId)))
    .returning();
  return result.length > 0;
}
