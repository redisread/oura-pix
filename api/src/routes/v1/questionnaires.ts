/**
 * Public API v1 — Questionnaire endpoints
 *
 * Authenticated via API Key (Authorization: Bearer op_xxx).
 * Provides CRUD access to questionnaire definitions and user responses.
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { createDb, schema } from "@oura-pix/database";
import { apiKeyAuth } from "../../middleware/apiKeyAuth";
import { createApiKeyRouter } from "../../lib/route";
import { notFound } from "../../lib/http";

const questionnaires = createApiKeyRouter();

// All questionnaire routes require API key
questionnaires.use("/*", apiKeyAuth);

/**
 * Questionnaire type enum validation
 */
const questionnaireTypeSchema = z.enum(["onboarding", "pre_generation", "feedback"]);

/**
 * Response submission validation
 */
const submitResponseSchema = z.object({
  responses: z.record(z.string(), z.unknown()),
  generationId: z.string().optional(),
});

/**
 * GET /api/v1/questionnaires/:type
 * Return the active questionnaire definition for a given type.
 * Includes all questions ordered by sort_order.
 */
questionnaires.get("/:type", async (c) => {
  const qType = c.req.param("type");

  // Validate type param
  const typeResult = questionnaireTypeSchema.safeParse(qType);
  if (!typeResult.success) {
    return c.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: "badRequest",
          details: z.flattenError(typeResult.error),
        },
      },
      400
    );
  }

  const db = createDb(c.env.DB);

  // Find the active questionnaire of this type
  const [questionnaire] = await db
    .select()
    .from(schema.questionnaires)
    .where(
      and(
        eq(schema.questionnaires.type, typeResult.data),
        eq(schema.questionnaires.isActive, true)
      )
    )
    .limit(1);

  if (!questionnaire) {
    return notFound(c, "questionnaireNotFound");
  }

  // Fetch associated questions ordered by sort_order
  const questions = await db
    .select()
    .from(schema.questions)
    .where(eq(schema.questions.questionnaireId, questionnaire.id))
    .orderBy(schema.questions.sortOrder);

  return c.json({
    success: true,
    data: {
      questionnaire: {
        id: questionnaire.id,
        type: questionnaire.type,
        title: questionnaire.title,
        description: questionnaire.description,
      },
      questions: questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options,
        isRequired: q.isRequired,
        sortOrder: q.sortOrder,
      })),
    },
  });
});

/**
 * POST /api/v1/questionnaires/:type/responses
 * Submit user responses for a given questionnaire type.
 */
questionnaires.post(
  "/:type/responses",
  zValidator("json", submitResponseSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "validationFailed",
            details: z.flattenError(result.error),
          },
        },
        400
      );
    }
  }),
  async (c) => {
    const qType = c.req.param("type");

    // Validate type
    const typeResult = questionnaireTypeSchema.safeParse(qType);
    if (!typeResult.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "badRequest",
            details: z.flattenError(typeResult.error),
          },
        },
        400
      );
    }

    const db = createDb(c.env.DB);
    const { responses, generationId } = c.req.valid("json");
    const apiKeyUser = c.get("apiKeyUser");

    // Find the active questionnaire
    const [questionnaire] = await db
      .select()
      .from(schema.questionnaires)
      .where(
        and(
          eq(schema.questionnaires.type, typeResult.data),
          eq(schema.questionnaires.isActive, true)
        )
      )
      .limit(1);

    if (!questionnaire) {
      return notFound(c, "questionnaireNotFound");
    }

    // Check for existing response (same user + questionnaire + generation)
    const existingConditions = [
      eq(schema.userResponses.userId, apiKeyUser.id),
      eq(schema.userResponses.questionnaireId, questionnaire.id),
    ];
    if (generationId) {
      existingConditions.push(eq(schema.userResponses.generationId, generationId));
    }

    const [existing] = await db
      .select({ id: schema.userResponses.id })
      .from(schema.userResponses)
      .where(and(...existingConditions))
      .limit(1);

    if (existing) {
      return c.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: "alreadySubmitted",
          },
        },
        409
      );
    }

    // Insert the response
    const responseId = crypto.randomUUID();
    await db
      .insert(schema.userResponses)
      .values({
        id: responseId,
        userId: apiKeyUser.id,
        questionnaireId: questionnaire.id,
        generationId: generationId ?? null,
        responses,
      });

    return c.json(
      {
        success: true,
        data: {
          id: responseId,
          questionnaireId: questionnaire.id,
        },
      },
      201
    );
  }
);

/**
 * GET /api/v1/questionnaires/responses
 * Get the current user's questionnaire response history.
 */
questionnaires.get("/responses", async (c) => {
  const db = createDb(c.env.DB);
  const apiKeyUser = c.get("apiKeyUser");

  const userResponses = await db
    .select({
      id: schema.userResponses.id,
      questionnaireId: schema.userResponses.questionnaireId,
      generationId: schema.userResponses.generationId,
      responses: schema.userResponses.responses,
      completedAt: schema.userResponses.completedAt,
      questionnaireTitle: schema.questionnaires.title,
      questionnaireType: schema.questionnaires.type,
    })
    .from(schema.userResponses)
    .innerJoin(
      schema.questionnaires,
      eq(schema.userResponses.questionnaireId, schema.questionnaires.id)
    )
    .where(eq(schema.userResponses.userId, apiKeyUser.id))
    .orderBy(schema.userResponses.completedAt);

  return c.json({
    success: true,
    data: userResponses.map((r) => ({
      id: r.id,
      questionnaireId: r.questionnaireId,
      questionnaireTitle: r.questionnaireTitle,
      questionnaireType: r.questionnaireType,
      generationId: r.generationId,
      responses: r.responses,
      completedAt: r.completedAt,
    })),
  });
});

export default questionnaires;
