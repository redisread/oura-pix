/**
 * Generations API Service
 *
 * 提供生成历史的 CRUD 操作
 * 统一使用 Drizzle ORM 进行数据库操作
 */

import { getDb } from "@/lib/db-utils";
import { generations, images, subscriptions, usageLogs } from "@/db/schema";
import type { GenerationSettings, GenerationResult } from "@/db/schema";
import { eq, and, gte, desc, sql, count, inArray } from "drizzle-orm";

// 时间筛选类型
export type TimeFilter = "all" | "today" | "week" | "month";

// 生成状态类型
export type GenerationStatus = "completed" | "processing" | "failed" | "pending";

// 生成记录响应类型
export interface GenerationRecord {
  id: string;
  prompt: string | null;
  platform: string;
  style: string;
  language: string;
  count: number;
  productImageId: string | null;
  productImageUrl: string | null;
  referenceImageUrls: string[];
  generatedImages: string[];
  createdAt: Date;
  status: GenerationStatus;
  errorMessage?: string | null;
}

// 分页信息
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 列表响应类型
export interface GenerationListResponse {
  data: GenerationRecord[];
  pagination: PaginationInfo;
}

// 列表请求参数
export interface GenerationListParams {
  page?: number;
  pageSize?: number;
  filter?: TimeFilter;
  userId: string;
}

/**
 * 获取时间筛选的起始日期
 */
function getFilterStartDate(filter: TimeFilter): Date | null {
  const now = new Date();

  switch (filter) {
    case "today":
      return new Date(now.setHours(0, 0, 0, 0));
    case "week":
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return weekAgo;
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

/**
 * 将数据库记录转换为 API 响应格式
 */
function transformRecord(
  record: typeof generations.$inferSelect,
  productImage: typeof images.$inferSelect | null,
  referenceImages: (typeof images.$inferSelect)[]
): GenerationRecord {
  const settings = record.settings as GenerationSettings | null;
  const results = record.results as GenerationResult[] | null;

  return {
    id: record.id,
    prompt: record.prompt,
    platform: settings?.targetPlatform || "generic",
    style: settings?.style || "professional",
    language: settings?.language || "en",
    count: settings?.count || results?.length || 0,
    productImageId: record.productImageId,
    productImageUrl: productImage?.url || null,
    referenceImageUrls: referenceImages.map((img) => img.url),
    generatedImages: results?.map((r) => r.imageUrl).filter(Boolean) as string[] || [],
    createdAt: record.createdAt,
    status: record.status as GenerationStatus,
    errorMessage: record.errorMessage,
  };
}

/**
 * 获取生成历史列表
 */
export async function getGenerationsList(
  params: GenerationListParams
): Promise<GenerationListResponse> {
  const db = await getDb();
  const { page = 1, pageSize = 10, filter = "all", userId } = params;

  // 构建查询条件
  const startDate = getFilterStartDate(filter);

  // 构建基础查询条件
  const baseCondition = startDate
    ? and(
        eq(generations.userId, userId),
        gte(generations.createdAt, startDate)
      )
    : eq(generations.userId, userId);

  // 查询总数
  const countResult = await db
    .select({ count: count() })
    .from(generations)
    .where(baseCondition);

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / pageSize);

  // 分页查询
  const offset = (page - 1) * pageSize;
  const records = await db.query.generations.findMany({
    where: baseCondition,
    orderBy: [desc(generations.createdAt)],
    limit: pageSize,
    offset: offset,
  });

  // 批量收集所有 image IDs，单次查询避免 N+1
  const allProductImageIds = records.map(r => r.productImageId).filter(Boolean) as string[];
  const allReferenceImageIds = records.flatMap(r => (r.referenceImageIds as string[] | null) ?? []);
  const allImageIds = [...new Set([...allProductImageIds, ...allReferenceImageIds])];

  const imageMap = new Map<string, typeof images.$inferSelect>();
  if (allImageIds.length > 0) {
    const allImages = await db.query.images.findMany({
      where: inArray(images.id, allImageIds),
    });
    allImages.forEach(img => imageMap.set(img.id, img));
  }

  // 使用内存 map 做映射，循环内不再发 DB 请求
  const transformedData: GenerationRecord[] = [];

  for (const record of records) {
    const productImage = record.productImageId ? (imageMap.get(record.productImageId) ?? null) : null;
    const refIds = record.referenceImageIds as string[] | null;
    const referenceImages = refIds ? refIds.map(id => imageMap.get(id)).filter(Boolean) as (typeof images.$inferSelect)[] : [];

    transformedData.push(transformRecord(record, productImage, referenceImages));
  }

  return {
    data: transformedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
    },
  };
}

/**
 * 获取单个生成记录详情
 */
export async function getGenerationById(
  id: string,
  userId: string
): Promise<GenerationRecord | null> {
  const db = await getDb();

  const record = await db.query.generations.findFirst({
    where: and(
      eq(generations.id, id),
      eq(generations.userId, userId)
    ),
  });

  if (!record) {
    return null;
  }

  let productImage: typeof images.$inferSelect | null = null;
  let referenceImages: (typeof images.$inferSelect)[] = [];

  // 获取商品图片
  if (record.productImageId) {
    const result = await db.query.images.findFirst({
      where: eq(images.id, record.productImageId),
    });
    productImage = result ?? null;
  }

  // 获取参考图片
  const refIds = record.referenceImageIds as string[] | null;
  if (refIds && refIds.length > 0) {
    referenceImages = await db.query.images.findMany({
      where: inArray(images.id, refIds),
    });
  }

  return transformRecord(record, productImage, referenceImages);
}

/**
 * 删除生成记录
 */
export async function deleteGeneration(
  id: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();

  // 验证记录是否存在且属于当前用户
  const record = await db.query.generations.findFirst({
    where: and(
      eq(generations.id, id),
      eq(generations.userId, userId)
    ),
    columns: { id: true },
  });

  if (!record) {
    return { success: false, error: "Record not found" };
  }

  // 删除记录
  await db.delete(generations).where(eq(generations.id, id));

  return { success: true };
}

/**
 * 获取用户统计数据
 */
export async function getUserStats(userId: string): Promise<{
  totalGenerations: number;
  thisMonth: number;
  remainingCredits: number;
  favoriteStyle: string;
}> {
  const db = await getDb();

  // 总生成数
  const totalResult = await db
    .select({ count: count() })
    .from(generations)
    .where(eq(generations.userId, userId));

  // 本月生成数
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthResult = await db
    .select({ count: count() })
    .from(generations)
    .where(and(
      eq(generations.userId, userId),
      gte(generations.createdAt, monthStart)
    ));

  // 获取最常用的风格 - 使用 SQL 片段处理 JSON 提取
  const styleResult = await db
    .select({
      style: sql<string>`json_extract(${generations.settings}, '$.style')`,
      count: count(),
    })
    .from(generations)
    .where(and(
      eq(generations.userId, userId),
      sql`${generations.settings} IS NOT NULL`
    ))
    .groupBy(sql`json_extract(${generations.settings}, '$.style')`)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  // 获取订阅信息中的剩余额度
  const subResult = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: {
      generationLimit: true,
      usedGenerations: true,
    },
  });

  const limit = subResult?.generationLimit || 10;
  const used = subResult?.usedGenerations || 0;

  // 返回 style key，由 UI 层调用 t(`profile.stats.styles.${key}`) 翻译
  const validStyles = ["professional", "lifestyle", "minimal", "luxury"] as const;
  const rawStyle = styleResult[0]?.style;
  const favoriteStyle = validStyles.includes(rawStyle as typeof validStyles[number])
    ? rawStyle
    : "professional";

  return {
    totalGenerations: totalResult[0]?.count || 0,
    thisMonth: monthResult[0]?.count || 0,
    remainingCredits: limit - used,
    favoriteStyle,
  };
}