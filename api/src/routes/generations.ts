/**
 * Generations Routes
 *
 * CRUD operations for generation tasks
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "@oura-pix/database";
import { getUser } from "../middleware/auth";
import {
  getGenerationsList,
  getGenerationById,
  deleteGeneration,
  cancelGeneration,
  getUserStats,
  createGeneration,
  processGeneration,
} from "../services/generation-service";
import { getTeamForUser } from "../services/teamService";

const router = new Hono<{
  Bindings: {
    DB: D1Database;
    GEMINI_API_KEY?: string;
    GEMINI_BASE_URL?: string;
    GEMINI_MODEL?: string;
  };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
  };
}>();

// Validation schemas
const createGenerationSchema = z.object({
  productImageId: z.string(),
  referenceImageIds: z.array(z.string()).optional(),
  teamId: z.string().optional(),
  prompt: z.string().optional(),
  settings: z.object({
    targetPlatform: z.enum(["amazon", "ebay", "shopify", "etsy", "generic"]),
    language: z.string(),
    count: z.number().min(1).max(10),
    style: z.enum(["professional", "lifestyle", "minimal", "luxury"]),
    generateImages: z.boolean().optional(),
    imageCount: z.number().min(1).max(10).optional(),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]),
    allowPersons: z.boolean().optional(),
  }),
});

// GET /api/generations - List generations
router.get("/", async (c) => {
  const user = getUser(c);
  if (!user) {
    return c.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not found" },
      },
      401
    );
  }

  const page = parseInt(c.req.query("page") || "1", 10);
  const pageSize = parseInt(c.req.query("pageSize") || "10", 10);
  const filter = (c.req.query("filter") as "all" | "today" | "week" | "month" | undefined) || "all";
  const statsOnly = c.req.query("stats") === "true";

  const db = createDb(c.env.DB);

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
  const user = getUser(c);
  if (!user) {
    return c.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not found" },
      },
      401
    );
  }

  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  const generation = await getGenerationById(db, id, user.id);

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
    data: generation,
  });
});

// POST /api/generations - Create generation
router.post(
  "/",
  zValidator("json", createGenerationSchema),
  async (c) => {
    const user = getUser(c);
    if (!user) {
      return c.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "User not found" },
        },
        401
      );
    }

    const body = c.req.valid("json");
    const db = createDb(c.env.DB);

    try {
      if (body.teamId) {
        const team = await getTeamForUser(db, body.teamId, user.id);
        if (!team) {
          return c.json(
            {
              success: false,
              error: { code: "FORBIDDEN", message: "You are not a member of this team" },
            },
            403
          );
        }
      }

      const generation = await createGeneration(db, user.id, body);
      c.executionCtx.waitUntil(processGeneration(c.env, generation.id));

      return c.json(
        {
          success: true,
          data: generation,
        },
        201
      );
    } catch (error) {
      console.error("[API] Create generation error:", error);
      return c.json(
        {
          success: false,
          error: { code: "INTERNAL_ERROR", message: "Failed to create generation" },
        },
        500
      );
    }
  }
);

// POST /api/generations/:id/cancel - Cancel generation
router.post("/:id/cancel", async (c) => {
  const user = getUser(c);
  if (!user) {
    return c.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not found" },
      },
      401
    );
  }

  const id = c.req.param("id");
  const db = createDb(c.env.DB);
  const result = await cancelGeneration(db, id, user.id);

  if (!result.success) {
    return c.json(
      {
        success: false,
        error: { code: "CANCEL_FAILED", message: result.error || "Failed to cancel generation" },
      },
      result.error === "Record not found" ? 404 : 409
    );
  }

  return c.json({ success: true });
});

// DELETE /api/generations/:id - Delete generation
router.delete("/:id", async (c) => {
  const user = getUser(c);
  if (!user) {
    return c.json(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "User not found" },
      },
      401
    );
  }

  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  const result = await deleteGeneration(db, id, user.id);

  if (!result.success) {
    return c.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: result.error || "Generation not found" },
      },
      404
    );
  }

  return c.json({
    success: true,
  });
});

export { router as generationRoutes };
