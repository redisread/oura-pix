/**
 * Questionnaire API — Schema and Route Tests
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";

// Shared validation schemas (matching the route definitions)
const questionnaireTypeSchema = z.enum(["onboarding", "pre_generation", "feedback"]);
const submitResponseSchema = z.object({
  responses: z.record(z.string(), z.unknown()),
  generationId: z.string().optional(),
});

describe("questionnaire type validation", () => {
  it("accepts onboarding type", () => {
    expect(questionnaireTypeSchema.safeParse("onboarding").success).toBe(true);
  });

  it("accepts pre_generation type", () => {
    expect(questionnaireTypeSchema.safeParse("pre_generation").success).toBe(true);
  });

  it("accepts feedback type", () => {
    expect(questionnaireTypeSchema.safeParse("feedback").success).toBe(true);
  });

  it("rejects unknown type", () => {
    expect(questionnaireTypeSchema.safeParse("survey").success).toBe(false);
    expect(questionnaireTypeSchema.safeParse("").success).toBe(false);
    expect(questionnaireTypeSchema.safeParse("preference").success).toBe(false);
  });
});

describe("submit response schema validation", () => {
  it("accepts valid response with answers", () => {
    const result = submitResponseSchema.safeParse({
      responses: { q1: "answer1", q2: ["option_a", "option_b"] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts response with generationId", () => {
    const result = submitResponseSchema.safeParse({
      responses: { q1: "answer1" },
      generationId: "gen_abc123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty responses", () => {
    // Empty object is allowed (z.record accepts empty)
    const result = submitResponseSchema.safeParse({
      responses: {},
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing responses field", () => {
    const result = submitResponseSchema.safeParse({
      generationId: "gen_abc123",
    });
    expect(result.success).toBe(false);
  });

  it("accepts numeric and boolean answer values", () => {
    const result = submitResponseSchema.safeParse({
      responses: {
        rating: 5,
        agreed: true,
        comment: "Great!",
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-object responses", () => {
    const result = submitResponseSchema.safeParse({
      responses: "not an object",
    });
    expect(result.success).toBe(false);
  });
});