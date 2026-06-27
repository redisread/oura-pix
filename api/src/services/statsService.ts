/**
 * Stats Service
 *
 * Handles generation statistics aggregation and analysis
 */

import { createDb, schema, sql, and, gte, eq } from "@oura-pix/database";

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export interface StatsData {
  totalGenerations: number;
  totalImages: number;
  avgGenerationTime: number;
  favoriteRate: number;
  byPlatform: { platform: string; count: number }[];
  byStyle: { style: string; count: number }[];
  trend: { date: string; count: number }[];
}

function getDateRange(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'all':
      return null;
  }
}

export async function getUserStats(userId: string, range: TimeRange = '30d', db: ReturnType<typeof createDb>): Promise<StatsData> {
  const dateFrom = getDateRange(range);

  // Base condition for date filtering
  const baseCondition = dateFrom
    ? and(eq(schema.generations.userId, userId), gte(schema.generations.createdAt, dateFrom))
    : eq(schema.generations.userId, userId);

  // 1. Total generations count
  const totalGenerationsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.generations)
    .where(baseCondition);

  const totalGenerations = totalGenerationsResult[0]?.count || 0;

  // 2. Total images generated (sum of generatedImageCount)
  const totalImagesResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${schema.generations.generatedImageCount}), 0)` })
    .from(schema.generations)
    .where(baseCondition);

  const totalImages = totalImagesResult[0]?.total || 0;

  // 3. Average generation time (placeholder - would need to calculate from timestamps if available)
  // For now, set to 0 as we don't have duration tracking
  const avgGenerationTime = 0;

  // 4. Favorite rate
  const favoritesCondition = dateFrom
    ? and(eq(schema.favorites.userId, userId), gte(schema.favorites.createdAt, dateFrom))
    : eq(schema.favorites.userId, userId);

  const favoritesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.favorites)
    .where(favoritesCondition);

  const totalFavorites = favoritesResult[0]?.count || 0;
  const favoriteRate = totalImages > 0 ? (totalFavorites / totalImages) * 100 : 0;

  // 5. Distribution by platform (extracted from settings JSON)
  const byPlatformResult = await db
    .select({
      platform: sql<string>`json_extract(${schema.generations.settings}, '$.targetPlatform')`,
      count: sql<number>`count(*)`,
    })
    .from(schema.generations)
    .where(baseCondition)
    .groupBy(sql`json_extract(${schema.generations.settings}, '$.targetPlatform')`)
    .orderBy(sql`count(*) DESC`);

  const byPlatform = byPlatformResult.map((r: { platform: string | null; count: number }) => ({
    platform: r.platform || 'unknown',
    count: r.count,
  }));

  // 6. Distribution by style (extracted from settings JSON)
  const byStyleResult = await db
    .select({
      style: sql<string>`json_extract(${schema.generations.settings}, '$.style')`,
      count: sql<number>`count(*)`,
    })
    .from(schema.generations)
    .where(baseCondition)
    .groupBy(sql`json_extract(${schema.generations.settings}, '$.style')`)
    .orderBy(sql`count(*) DESC`);

  const byStyle = byStyleResult.map((r: { style: string | null; count: number }) => ({
    style: r.style || 'unknown',
    count: r.count,
  }));

  // 7. Trend data (daily generation count)
  const trendResult = await db
    .select({
      date: sql<string>`DATE(${schema.generations.createdAt})`,
      count: sql<number>`count(*)`,
    })
    .from(schema.generations)
    .where(baseCondition)
    .groupBy(sql`DATE(${schema.generations.createdAt})`)
    .orderBy(sql`DATE(${schema.generations.createdAt}) ASC`);

  const trend = trendResult.map((r: { date: string; count: number }) => ({
    date: r.date,
    count: r.count,
  }));

  return {
    totalGenerations,
    totalImages,
    avgGenerationTime,
    favoriteRate: Math.round(favoriteRate * 10) / 10,
    byPlatform,
    byStyle,
    trend,
  };
}
