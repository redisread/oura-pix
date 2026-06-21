/**
 * Collection Service
 *
 * Favorites grouping/collections
 */

import { createDb, schema } from "@oura-pix/database";
import { eq, and, desc, sql } from "drizzle-orm";

export interface CollectionRecord {
  id: string;
  userId: string;
  name: string;
  color: string;
  description: string | null;
  createdAt: Date;
  itemCount?: number;
}

export async function listCollections(
  db: ReturnType<typeof createDb>,
  userId: string
): Promise<CollectionRecord[]> {
  const rows = await db
    .select({
      id: schema.collections.id,
      userId: schema.collections.userId,
      name: schema.collections.name,
      color: schema.collections.color,
      description: schema.collections.description,
      createdAt: schema.collections.createdAt,
      itemCount: sql<number>`count(${schema.favorites.id})`,
    })
    .from(schema.collections)
    .leftJoin(schema.favorites, eq(schema.favorites.collectionId, schema.collections.id))
    .where(eq(schema.collections.userId, userId))
    .groupBy(schema.collections.id)
    .orderBy(desc(schema.collections.createdAt));

  return rows.map((r) => ({ ...r, itemCount: r.itemCount }));
}

export async function createCollection(
  db: ReturnType<typeof createDb>,
  userId: string,
  input: { name: string; color?: string; description?: string }
): Promise<CollectionRecord> {
  const [created] = await db
    .insert(schema.collections)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      color: input.color ?? "#3b82f6",
      description: input.description ?? null,
      createdAt: new Date(),
    })
    .returning();
  return created!;
}

export async function updateCollection(
  db: ReturnType<typeof createDb>,
  collectionId: string,
  userId: string,
  input: { name?: string; color?: string; description?: string }
): Promise<CollectionRecord | null> {
  const update: Partial<typeof schema.collections.$inferInsert> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.color !== undefined) update.color = input.color;
  if (input.description !== undefined) update.description = input.description;

  const [updated] = await db
    .update(schema.collections)
    .set(update)
    .where(and(eq(schema.collections.id, collectionId), eq(schema.collections.userId, userId)))
    .returning();
  return updated ?? null;
}

export async function deleteCollection(
  db: ReturnType<typeof createDb>,
  collectionId: string,
  userId: string
): Promise<boolean> {
  // ON DELETE SET NULL will move favorites to uncategorized
  const result = await db
    .delete(schema.collections)
    .where(and(eq(schema.collections.id, collectionId), eq(schema.collections.userId, userId)))
    .returning();
  return result.length > 0;
}

export async function moveFavoriteToCollection(
  db: ReturnType<typeof createDb>,
  favoriteId: string,
  userId: string,
  collectionId: string | null
): Promise<boolean> {
  const result = await db
    .update(schema.favorites)
    .set({ collectionId })
    .where(and(eq(schema.favorites.id, favoriteId), eq(schema.favorites.userId, userId)))
    .returning();
  return result.length > 0;
}
