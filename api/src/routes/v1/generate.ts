/**
 * Public API v1 — Generation endpoints
 *
 * Authenticated via API Key (Authorization: Bearer op_xxx).
 * Mirrors the shape of /api/generations but is intended for external developers.
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "@oura-pix/database";
import { apiKeyAuth } from "../../middleware/apiKeyAuth";
import {
  getGenerationById,
  createGeneration,
  processGeneration,
} from "../../services/generation-service";

const generate = new Hono<{
  Bindings: {
    DB: D1Database;
    GEMINI_API_KEY?: string;
    GEMINI_BASE_URL?: string;
    GEMINI_MODEL?: string;
  };
  Variables: {
    apiKey: { id: string; userId: string; name: string };
    apiKeyUser: { id: string; email: string };
  };
}>();

// All routes require API key
generate.use("/*", apiKeyAuth);

const createSchema = z.object({
  productImageId: z.string(),
  referenceImageIds: z.array(z.string()).optional(),
  prompt: z.string().max(2000).optional(),
  settings: z.object({
    targetPlatform: z.enum(["amazon", "ebay", "shopify", "etsy", "generic"]),
    language: z.string().min(2).max(10),
    count: z.number().int().min(1).max(10),
    style: z.enum(["professional", "lifestyle", "minimal", "luxury"]),
    generateImages: z.boolean().optional(),
    imageCount: z.number().int().min(1).max(10).optional(),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]),
    allowPersons: z.boolean().optional(),
  }),
});

/**
 * POST /api/v1/generate
 * Trigger a new generation. Returns the generation ID and initial status.
 */
generate.post("/", zValidator("json", createSchema), async (c) => {
  const apiKeyUser = c.get("apiKeyUser");
  const body = c.req.valid("json");

  try {
    const db = createDb(c.env.DB);
    const generation = await createGeneration(db, apiKeyUser.id, body);
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
  } catch (error) {
    console.error("[v1/generate] Create error:", error);
    return c.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to create generation" },
      },
      500
    );
  }
});

/**
 * GET /api/v1/generation/:id
 * Get the status and result of a generation.
 */
generate.get("/:id", async (c) => {
  const apiKeyUser = c.get("apiKeyUser");
  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const generation = await getGenerationById(db, id, apiKeyUser.id);
    if (!generation) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Generation not found" },
        },
        404
      );
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
  } catch (error) {
    console.error("[v1/generate] Get error:", error);
    return c.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch generation" },
      },
      500
    );
  }
});

/**
 * GET /api/v1/generation/:id/download
 * Returns a JSON list of image URLs for the completed generation.
 * (P0: returns URLs; signed download URLs can be added in P1.)
 */
generate.get("/:id/download", async (c) => {
  const apiKeyUser = c.get("apiKeyUser");
  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const generation = await getGenerationById(db, id, apiKeyUser.id);
    if (!generation) {
      return c.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Generation not found" },
        },
        404
      );
    }
    if (generation.status !== "completed") {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_READY",
            message: `Generation is ${generation.status}, not completed yet`,
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
  } catch (error) {
    console.error("[v1/generate] Download error:", error);
    return c.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch images" },
      },
      500
    );
  }
});

export default generate;
