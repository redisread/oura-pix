/**
 * @oura-pix/database — Shared database utilities
 *
 * Re-exports types from @oura-pix/types and provides Drizzle ORM
 * database utilities for the OuraPix monorepo.
 */

import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./schema";

export * from "./schema";
export type {
  GenerationResult,
  GenerationSettings,
  TemplateSettings,
} from "@oura-pix/types";
export { schema };

// Re-export drizzle-orm operators
export { eq, and, or, gt, gte, lt, lte, desc, asc, inArray, notInArray, like, sql, count } from "drizzle-orm";

/**
 * 创建 Drizzle ORM 实例
 */
export function createDb(d1Database: D1Database) {
  return drizzle(d1Database, { schema });
}

export type DB = ReturnType<typeof createDb>;

export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export type Session = typeof schema.sessions.$inferSelect;
export type NewSession = typeof schema.sessions.$inferInsert;

export type Image = typeof schema.images.$inferSelect;
export type NewImage = typeof schema.images.$inferInsert;

export type Generation = typeof schema.generations.$inferSelect;
export type NewGeneration = typeof schema.generations.$inferInsert;

export type Subscription = typeof schema.subscriptions.$inferSelect;
export type NewSubscription = typeof schema.subscriptions.$inferInsert;

export type UsageLog = typeof schema.usageLogs.$inferSelect;
export type NewUsageLog = typeof schema.usageLogs.$inferInsert;

export type Favorite = typeof schema.favorites.$inferSelect;
export type NewFavorite = typeof schema.favorites.$inferInsert;

export type Survey = typeof schema.surveys.$inferSelect;
export type NewSurvey = typeof schema.surveys.$inferInsert;

export type SurveyQuestion = typeof schema.surveyQuestions.$inferSelect;
export type NewSurveyQuestion = typeof schema.surveyQuestions.$inferInsert;

export type SurveyResponse = typeof schema.surveyResponses.$inferSelect;
export type NewSurveyResponse = typeof schema.surveyResponses.$inferInsert;
