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

  const baseCondition = dateFrom
    ? and(eq(schema.generations.userId, userId), gte(schema.generations.createdAt, dateFrom))
    : eq(schema.generations.userId, userId);

  const favoritesCondition = dateFrom
    ? and(eq(schema.favorites.userId, userId), gte(schema.favorites.createdAt, dateFrom))
    : eq(schema.favorites.userId, userId);

  // Run all independent queries in parallel
  const [
    [totalGenerationsResult],
    [totalImagesResult],
    [favoritesResult],
    byPlatformResult,
    byStyleResult,
    trendResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(schema.generations).where(baseCondition),
    db.select({ total: sql<number>`COALESCE(SUM(${schema.generations.generatedImageCount}), 0)` }).from(schema.generations).where(baseCondition),
    db.select({ count: sql<number>`count(*)` }).from(schema.favorites).where(favoritesCondition),
    db.select({
      platform: sql<string>`json_extract(${schema.generations.settings}, '$.targetPlatform')`,
      count: sql<number>`count(*)`,
    }).from(schema.generations).where(baseCondition)
      .groupBy(sql`json_extract(${schema.generations.settings}, '$.targetPlatform')`)
      .orderBy(sql`count(*) DESC`),
    db.select({
      style: sql<string>`json_extract(${schema.generations.settings}, '$.style')`,
      count: sql<number>`count(*)`,
    }).from(schema.generations).where(baseCondition)
      .groupBy(sql`json_extract(${schema.generations.settings}, '$.style')`)
      .orderBy(sql`count(*) DESC`),
    db.select({
      date: sql<string>`DATE(${schema.generations.createdAt})`,
      count: sql<number>`count(*)`,
    }).from(schema.generations).where(baseCondition)
      .groupBy(sql`DATE(${schema.generations.createdAt})`)
      .orderBy(sql`DATE(${schema.generations.createdAt}) ASC`),
  ]);

  const totalGenerations = totalGenerationsResult?.count || 0;
  const totalImages = totalImagesResult?.total || 0;
  const totalFavorites = favoritesResult?.count || 0;

  return {
    totalGenerations,
    totalImages,
    avgGenerationTime: 0,
    favoriteRate: Math.round((totalImages > 0 ? (totalFavorites / totalImages) * 100 : 0) * 10) / 10,
    byPlatform: byPlatformResult.map((r) => ({ platform: r.platform || 'unknown', count: r.count })),
    byStyle: byStyleResult.map((r) => ({ style: r.style || 'unknown', count: r.count })),
    trend: trendResult.map((r) => ({ date: r.date, count: r.count })),
  };
}
