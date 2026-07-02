/**
 * Generations Routes
 *
 * CRUD operations for generation tasks
 */

import { z } from "zod";
import { eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { createDb, schema } from "@oura-pix/database";
import { serverMessage } from "@oura-pix/i18n";
import {
  getGenerationsList,
  getGenerationById,
  deleteGeneration,
  cancelGeneration,
  getUserStats,
  createGeneration,
  processGeneration,
} from "../services/generation-service";
import { generateProductCopy } from "../services/geminiService";
import { getTeamForUser } from "../services/teamService";
import { getLocale } from "../lib/i18n";
import { createRouter, useCtx } from "../lib/route";
import { badRequest, forbidden, notFound } from "../lib/http";

const router = createRouter<{
  R2: R2Bucket;
  CLOUDFLARE_R2_PUBLIC_URL: string;
  GEMINI_API_KEY?: string;
  GEMINI_BASE_URL?: string;
  GEMINI_MODEL?: string;
}>();

// Validation schemas
export const createGenerationSchema = z.object({
  productImageId: z.string(),
  referenceImageIds: z.array(z.string()).optional(),
  teamId: z.string().optional(),
  prompt: z.string().optional(),
  settings: z.object({
    targetPlatform: z.enum(["amazon", "ebay", "shopify", "etsy", "generic"]),
    language: z.enum(["zh", "en", "ja"]),
    uiLocale: z.enum(["zh-CN", "en", "ja"]).optional(),
    count: z.number().min(1).max(10),
    style: z.enum(["professional", "lifestyle", "minimal", "luxury"]),
    generateImages: z.boolean().optional(),
    imageCount: z.number().min(1).max(10).optional(),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]),
    allowPersons: z.boolean().optional(),
  }),
});

const validateCreateGeneration = zValidator("json", createGenerationSchema, (result, c) => {
  if (!result.success) {
    const locale = getLocale(c);
    return c.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: serverMessage(locale, "badRequest"),
          details: z.flattenError(result.error),
        },
      },
      400
    );
  }
});

// GET /api/generations - List generations
router.get("/", async (c) => {
  const { user, db } = useCtx(c);
  const page = parseInt(c.req.query("page") || "1", 10);
  const pageSize = parseInt(c.req.query("pageSize") || "10", 10);
  const filter = (c.req.query("filter") as "all" | "today" | "week" | "month" | undefined) || "all";
  const statsOnly = c.req.query("stats") === "true";

  if (statsOnly) {
    const stats = await getUserStats(db, user.id);
    return c.json({
      success: true,
      data: { stats },
    });
  }

  const result = await getGenerationsList(db, {
    userId: user.id,
    page: page || 1,
    pageSize: pageSize > 100 ? 100 : pageSize || 10,
    filter,
  });

  return c.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

// GET /api/generations/:id - Get generation by ID
router.get("/:id", async (c) => {
  const { user, db } = useCtx(c);
  const id = c.req.param("id");

  const generation = await getGenerationById(db, id, user.id);

  if (!generation) return notFound(c, "generationNotFound");

  return c.json({
    success: true,
    data: generation,
  });
});

// POST /api/generations - Create generation
router.post(
  "/",
  validateCreateGeneration,
  async (c) => {
    const { user, db } = useCtx(c);
    const body = c.req.valid("json");

    if (body.teamId) {
      const team = await getTeamForUser(db, body.teamId, user.id);
      if (!team) return forbidden(c);
    }

    const generation = await createGeneration(db, user.id, body);
    c.executionCtx.waitUntil(processGeneration(c.env, generation.id));

    return c.json({
      success: true,
      data: {
        id: generation.id,
        status: generation.status,
        createdAt: generation.createdAt,
      },
    }, 201);
  }
);

// PUT /api/generations/:id/cancel - Cancel a running generation
router.put("/:id/cancel", async (c) => {
  const { user, db } = useCtx(c);
  const id = c.req.param("id");

  const result = await cancelGeneration(db, id, user.id);
  if (!result.success) return notFound(c, "generationNotFound");
  return c.json({ success: true });
});

// POST /api/generations/:id/image - Update a result image
router.post("/:id/image", async (c) => {
  const { user, db } = useCtx(c);
  const { R2, CLOUDFLARE_R2_PUBLIC_URL } = c.env;

  const id = c.req.param("id");
  const { imageIndex } = await c.req.json() as { imageIndex: number };

  const formData = await c.req.formData();
  const imageFile = formData.get("image") as File | null;

  if (!imageFile) return badRequest(c);

  const generation = await getGenerationById(db, id, user.id);
  if (!generation) return notFound(c, "generationNotFound");

  const ext = imageFile.name.split(".").pop() || "png";
  const key = `edits/${user.id}/${crypto.randomUUID()}.${ext}`;

  await R2.put(key, imageFile, {
    httpMetadata: {
      contentType: imageFile.type || "image/png",
    },
  });

  const editedImageUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

  const currentResults = generation.results ?? [];
  const updatedResults = [...currentResults];

  if (updatedResults[imageIndex]) {
    updatedResults[imageIndex] = {
      ...updatedResults[imageIndex],
      imageUrl: editedImageUrl,
    };
  } else {
    updatedResults.push({
      id: crypto.randomUUID(),
      title: updatedResults[0]?.title ?? "",
      description: updatedResults[0]?.description ?? "",
      tags: updatedResults[0]?.tags ?? [],
      imageUrl: editedImageUrl,
    });
  }

  await db
    .update(schema.generations)
    .set({
      results: updatedResults,
      updatedAt: new Date(),
    })
    .where(eq(schema.generations.id, id));

  return c.json({
    success: true,
    data: { imageUrl: editedImageUrl },
  });
});

// DELETE /api/generations/:id - Delete generation
router.delete("/:id", async (c) => {
  const { user, db } = useCtx(c);
  const id = c.req.param("id");

  const result = await deleteGeneration(db, id, user.id);

  if (!result.success) return notFound(c, "generationNotFound");

  return c.json({
    success: true,
  });
});

// POST /api/generations/preview - Preview one variant (P0 T4 #86)
export const previewGenerationSchema = z.object({
  productImageId: z.string().optional(),
  prompt: z.string().optional(),
  settings: z.object({
    targetPlatform: z.enum(["amazon", "ebay", "shopify", "etsy", "generic"]),
    language: z.enum(["zh", "en", "ja"]),
    uiLocale: z.enum(["zh-CN", "en", "ja"]).optional(),
    style: z.enum(["professional", "lifestyle", "minimal", "luxury"]),
    count: z.number().min(1).max(10).optional(),
  }),
});

const validatePreviewGeneration = zValidator("json", previewGenerationSchema, (result, c) => {
  if (!result.success) {
    const locale = getLocale(c);
    return c.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: serverMessage(locale, "badRequest"),
          details: z.flattenError(result.error),
        },
      },
      400
    );
  }
});

router.post(
  "/preview",
  validatePreviewGeneration,
  async (c) => {
    const body = c.req.valid("json");
    const db = createDb(c.env.DB);

    let productImage: { url: string; mimeType: string } | null = null;
    if (body.productImageId) {
      const image = await db.query.images.findFirst({
        where: (images, { eq }) => eq(images.id, body.productImageId!),
      });
      if (image) {
        productImage = { url: image.url, mimeType: image.mimeType };
      }
    }

    const settings = {
      targetPlatform: body.settings.targetPlatform,
      language: body.settings.language,
      uiLocale: body.settings.uiLocale,
      count: 1, // Preview forces count=1
      style: body.settings.style,
      generateImages: false,
    };

    const results = await generateProductCopy({
      env: c.env,
      productImage,
      referenceImages: [],
      prompt: body.prompt,
      settings,
    });

    const first = results[0];
    if (!first) return notFound(c);

    return c.json({
      success: true,
      data: {
        preview: {
          title: first.title,
          description: first.description,
          keywords: first.tags ?? [],
        },
      },
    });
  }
);

export default router;
