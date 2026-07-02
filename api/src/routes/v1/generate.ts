/**
 * Public API v1 — Generation endpoints
 *
 * Authenticated via API Key (Authorization: Bearer op_xxx).
 * Mirrors the shape of /api/generations but is intended for external developers.
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "@oura-pix/database";
import { serverMessage } from "@oura-pix/i18n";
import { apiKeyAuth } from "../../middleware/apiKeyAuth";
import {
  getGenerationById,
  createGeneration,
  processGeneration,
} from "../../services/generation-service";
import { getLocale } from "../../lib/i18n";
import { createApiKeyRouter } from "../../lib/route";
import { notFound } from "../../lib/http";

const generate = createApiKeyRouter<{
  GEMINI_API_KEY?: string;
  GEMINI_BASE_URL?: string;
  GEMINI_MODEL?: string;
}>();

// All routes require API key
generate.use("/*", apiKeyAuth);

const createSchema = z.object({
  productImageId: z.string(),
  referenceImageIds: z.array(z.string()).optional(),
  prompt: z.string().max(2000).optional(),
  settings: z.object({
    targetPlatform: z.enum(["amazon", "ebay", "shopify", "etsy", "generic"]),
    language: z.enum(["zh", "en", "ja"]),
    uiLocale: z.enum(["zh-CN", "en", "ja"]).optional(),
    count: z.number().int().min(1).max(10),
    style: z.enum(["professional", "lifestyle", "minimal", "luxury"]),
    generateImages: z.boolean().optional(),
    imageCount: z.number().int().min(1).max(10).optional(),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]),
    allowPersons: z.boolean().optional(),
  }),
});

const validateCreateGeneration = zValidator("json", createSchema, (result, c) => {
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

/**
 * POST /api/v1/generate
 * Trigger a new generation. Returns the generation ID and initial status.
 */
generate.post("/", validateCreateGeneration, async (c) => {
  const locale = getLocale(c);
  const apiKeyUser = c.get("apiKeyUser");
  const body = c.req.valid("json");

  const db = createDb(c.env.DB);
  const generation = await createGeneration(db, apiKeyUser.id, {
    ...body,
    settings: {
      ...body.settings,
      uiLocale: body.settings.uiLocale ?? locale,
    },
  });
  c.executionCtx.waitUntil(processGeneration(c.env, generation.id));
  return c.json(
    {
      success: true,
      data: {
        id: generation.id,
        status: generation.status,
        createdAt: generation.createdAt,
      },
    },
    201
  );
});

/**
 * GET /api/v1/generation/:id
 * Get the status and result of a generation.
 */
generate.get("/:id", async (c) => {
  const apiKeyUser = c.get("apiKeyUser");
  const id = c.req.param("id");

  const db = createDb(c.env.DB);
  const generation = await getGenerationById(db, id, apiKeyUser.id);
  if (!generation) {
    return notFound(c, "generationNotFound");
  }
  return c.json({
    success: true,
    data: {
      id: generation.id,
      status: generation.status,
      prompt: generation.prompt,
      generatedImages: generation.generatedImages,
      errorMessage: generation.errorMessage,
      createdAt: generation.createdAt,
    },
  });
});

/**
 * GET /api/v1/generation/:id/download
 * Returns a JSON list of image URLs for the completed generation.
 * (P0: returns URLs; signed download URLs can be added in P1.)
 */
generate.get("/:id/download", async (c) => {
  const locale = getLocale(c);
  const apiKeyUser = c.get("apiKeyUser");
  const id = c.req.param("id");

  const db = createDb(c.env.DB);
  const generation = await getGenerationById(db, id, apiKeyUser.id);
  if (!generation) {
    return notFound(c, "generationNotFound");
  }
  if (generation.status !== "completed") {
    const message = serverMessage(locale, "badRequest");
    return c.json(
      {
        success: false,
        error: {
          code: "NOT_READY",
          message,
          currentStatus: generation.status,
        },
      },
      409
    );
  }
  return c.json({
    success: true,
    data: {
      id: generation.id,
      images: generation.generatedImages.map((url, index) => ({
        index,
        url,
      })),
    },
  });
});

export default generate;
