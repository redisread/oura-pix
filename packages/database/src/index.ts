/**
 * @oura-pix/database - Shared database package
 *
 * Provides Drizzle ORM schema and database utilities for OuraPix
 */

import { drizzle } from "drizzle-orm/d1";
import type { D1Database } from "@cloudflare/workers-types";
import * as schema from "./schema";

export * from "./schema";
export { schema };

// Re-export drizzle-orm operators
export { eq, and, or, gt, gte, lt, lte, desc, asc, inArray, notInArray, like, sql, count } from "drizzle-orm";

/**
 * 创建 Drizzle ORM 实例
 * @param d1Database Cloudflare D1 数据库实例
 * @returns Drizzle ORM 实例
 */
export function createDb(d1Database: D1Database) {
  return drizzle(d1Database, { schema });
}

/**
 * 数据库类型导出
 */
export type DB = ReturnType<typeof createDb>;

/**
 * 表类型导出
 */
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
