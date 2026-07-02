/**
 * Favorites Routes
 *
 * CRUD operations for user favorites
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { schema, eq, and, desc, count, inArray } from "@oura-pix/database";
import { createRouter, useCtx } from "../lib/route";
import { notFound as notFoundErr } from "../lib/http";
import { apiMessage } from "../lib/i18n";

const router = createRouter();


// Validation schemas
const addFavoriteSchema = z.object({
  generationId: z.string(),
  imageUrl: z.string().url(),
  imageIndex: z.number().int().optional(),
});

// GET /api/favorites - List favorites
router.get("/", async (c) => {
  const { user, db } = useCtx(c);

  const page = parseInt(c.req.query("page") || "1", 10);
  const pageSize = parseInt(c.req.query("pageSize") || "20", 10);


  const countResult = await db
    .select({ count: count() })
    .from(schema.favorites)
    .where(eq(schema.favorites.userId, user.id));

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / pageSize);

  const offset = (page - 1) * pageSize;
  const favorites = await db.query.favorites.findMany({
    where: eq(schema.favorites.userId, user.id),
    orderBy: [desc(schema.favorites.createdAt)],
    limit: pageSize,
    offset,
  });

  const generationIds = [...new Set(favorites.map((f) => f.generationId))];
  let generations: Record<string, typeof schema.generations.$inferSelect> = {};

  if (generationIds.length > 0) {
    const genRecords = await db.query.generations.findMany({
      where: inArray(schema.generations.id, generationIds),
    });
    generations = Object.fromEntries(genRecords.map((g) => [g.id, g]));
  }

  const data = favorites.map((fav) => ({
    id: fav.id,
    generationId: fav.generationId,
    imageUrl: fav.imageUrl,
    imageIndex: fav.imageIndex,
    createdAt: fav.createdAt,
    generation: generations[fav.generationId]
      ? {
          id: generations[fav.generationId]!.id,
          status: generations[fav.generationId]!.status,
          settings: generations[fav.generationId]!.settings,
          createdAt: generations[fav.generationId]!.createdAt,
        }
      : null,
  }));

  return c.json({
    success: true,
    data,
    pagination: { page, pageSize, total, totalPages },
  });
});

// POST /api/favorites - Add favorite
router.post("/", zValidator("json", addFavoriteSchema), async (c) => {
  const { user, db } = useCtx(c);

  const body = c.req.valid("json");

  const existing = await db.query.favorites.findFirst({
    where: and(
      eq(schema.favorites.userId, user.id),
      eq(schema.favorites.imageUrl, body.imageUrl)
    ),
  });

  if (existing) {
    return c.json(
      { success: false, error: { code: "ALREADY_EXISTS", message: apiMessage(c, "alreadyFavorited") } },
      409
    );
  }

  const generation = await db.query.generations.findFirst({
    where: and(
      eq(schema.generations.id, body.generationId),
      eq(schema.generations.userId, user.id)
    ),
  });

  if (!generation) return notFoundErr(c, "generationNotFound");

  const [favorite] = await db
    .insert(schema.favorites)
    .values({
      userId: user.id,
      generationId: body.generationId,
      imageUrl: body.imageUrl,
      imageIndex: body.imageIndex ?? null,
    })
    .returning();

  return c.json({ success: true, data: favorite }, 201);
});

// DELETE /api/favorites/:id - Remove favorite
router.delete("/:id", async (c) => {
  const { user, db } = useCtx(c);

  const id = c.req.param("id");

  const favorite = await db.query.favorites.findFirst({
    where: and(
      eq(schema.favorites.id, id),
      eq(schema.favorites.userId, user.id)
    ),
  });

  if (!favorite) return notFoundErr(c);

  await db.delete(schema.favorites).where(eq(schema.favorites.id, id));
  return c.json({ success: true });
});

// POST /api/favorites/batch-delete - Remove multiple favorites
router.post("/batch-delete", zValidator("json", z.object({ ids: z.array(z.string()) })), async (c) => {
  const { user, db } = useCtx(c);

  const body = c.req.valid("json");

  if (body.ids.length === 0) {
    return c.json({ success: true, data: { deleted: 0 } });
  }

  const deleted = await db
    .delete(schema.favorites)
    .where(and(
      inArray(schema.favorites.id, body.ids),
      eq(schema.favorites.userId, user.id)
    ))
    .returning();

  return c.json({ success: true, data: { deleted: deleted.length } });
});

// GET /api/favorites/check/:imageUrl - Check if image is favorited
router.get("/check/:imageUrl", async (c) => {
  const { user, db } = useCtx(c);

  const imageUrl = c.req.param("imageUrl");

  const favorite = await db.query.favorites.findFirst({
    where: and(
      eq(schema.favorites.userId, user.id),
      eq(schema.favorites.imageUrl, decodeURIComponent(imageUrl))
    ),
  });

  return c.json({
    success: true,
    data: { isFavorited: !!favorite, favoriteId: favorite?.id || null },
  });
});

export default router;
