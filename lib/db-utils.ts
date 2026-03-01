/**
 * Database Utilities
 *
 * 提供统一的数据库访问方式，简化 Drizzle ORM 使用
 */

import { getCloudflareContext } from "@/lib/cloudflare-context";
import { createDb } from "@/db";
import type { DB } from "@/db";

/**
 * 获取 Drizzle 数据库实例
 *
 * @returns Drizzle ORM 数据库实例
 */
export async function getDb(): Promise<DB> {
  const { env } = await getCloudflareContext();
  return createDb(env.DB);
}