/**
 * Generations API Service
 *
 * 提供生成历史的 CRUD 操作
 */

import { getCloudflareContext } from "@/lib/cloudflare-context";
import { generations, images } from "@/db/schema";
import type { GenerationSettings, GenerationResult } from "@/db/schema";

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
  const { env } = await getCloudflareContext();
  const { page = 1, pageSize = 10, filter = "all", userId } = params;

  // 构建查询条件
  const startDate = getFilterStartDate(filter);

  // 查询总数
  const countQuery = startDate
    ? `SELECT COUNT(*) as count FROM generations WHERE user_id = ? AND created_at >= ?`
    : `SELECT COUNT(*) as count FROM generations WHERE user_id = ?`;

  const countParams = startDate ? [userId, startDate.getTime()] : [userId];
  const allRecords = await env.DB.prepare(countQuery)
    .bind(...countParams)
    .first<{ count: number }>();

  const total = allRecords?.count || 0;
  const totalPages = Math.ceil(total / pageSize);

  // 分页查询
  const offset = (page - 1) * pageSize;
  const listQuery = startDate
    ? `SELECT * FROM generations WHERE user_id = ? AND created_at >= ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
    : `SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`;

  const listParams = startDate
    ? [userId, startDate.getTime(), pageSize, offset]
    : [userId, pageSize, offset];

  const records = await env.DB.prepare(listQuery)
    .bind(...listParams)
    .all<typeof generations.$inferSelect>();

  // 获取关联的图片信息
  const transformedData: GenerationRecord[] = [];

  for (const record of records.results) {
    let productImage: typeof images.$inferSelect | null = null;
    let referenceImages: (typeof images.$inferSelect)[] = [];

    // 获取商品图片
    if (record.productImageId) {
      const imgResult = await env.DB.prepare(
        "SELECT * FROM images WHERE id = ?"
      )
        .bind(record.productImageId)
        .first<typeof images.$inferSelect>();
      productImage = imgResult;
    }

    // 获取参考图片
    const refIds = record.referenceImageIds as string[] | null;
    if (refIds && refIds.length > 0) {
      const placeholders = refIds.map(() => "?").join(",");
      const refResults = await env.DB.prepare(
        `SELECT * FROM images WHERE id IN (${placeholders})`
      )
        .bind(...refIds)
        .all<typeof images.$inferSelect>();
      referenceImages = refResults.results;
    }

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
  const { env } = await getCloudflareContext();

  const record = await env.DB.prepare(
    "SELECT * FROM generations WHERE id = ? AND user_id = ?"
  )
    .bind(id, userId)
    .first<typeof generations.$inferSelect>();

  if (!record) {
    return null;
  }

  let productImage: typeof images.$inferSelect | null = null;
  let referenceImages: (typeof images.$inferSelect)[] = [];

  // 获取商品图片
  if (record.productImageId) {
    const imgResult = await env.DB.prepare(
      "SELECT * FROM images WHERE id = ?"
    )
      .bind(record.productImageId)
      .first<typeof images.$inferSelect>();
    productImage = imgResult;
  }

  // 获取参考图片
  const refIds = record.referenceImageIds as string[] | null;
  if (refIds && refIds.length > 0) {
    const placeholders = refIds.map(() => "?").join(",");
    const refResults = await env.DB.prepare(
      `SELECT * FROM images WHERE id IN (${placeholders})`
    )
      .bind(...refIds)
      .all<typeof images.$inferSelect>();
    referenceImages = refResults.results;
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
  const { env } = await getCloudflareContext();

  // 验证记录是否存在且属于当前用户
  const record = await env.DB.prepare(
    "SELECT id FROM generations WHERE id = ? AND user_id = ?"
  )
    .bind(id, userId)
    .first();

  if (!record) {
    return { success: false, error: "Record not found" };
  }

  // 删除记录
  await env.DB.prepare("DELETE FROM generations WHERE id = ?")
    .bind(id)
    .run();

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
  const { env } = await getCloudflareContext();

  // 总生成数
  const totalResult = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM generations WHERE user_id = ?"
  )
    .bind(userId)
    .first<{ count: number }>();

  // 本月生成数
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthResult = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM generations WHERE user_id = ? AND created_at >= ?"
  )
    .bind(userId, monthStart.getTime())
    .first<{ count: number }>();

  // 获取最常用的风格
  const styleResult = await env.DB.prepare(
    `SELECT json_extract(settings, '$.style') as style, COUNT(*) as count
     FROM generations
     WHERE user_id = ? AND settings IS NOT NULL
     GROUP BY style
     ORDER BY count DESC
     LIMIT 1`
  )
    .bind(userId)
    .first<{ style: string; count: number }>();

  // 获取订阅信息中的剩余额度
  const subResult = await env.DB.prepare(
    "SELECT generation_limit, used_generations FROM subscriptions WHERE user_id = ?"
  )
    .bind(userId)
    .first<{ generation_limit: number; used_generations: number }>();

  const limit = subResult?.generation_limit || 10;
  const used = subResult?.used_generations || 0;

  const styleNames: Record<string, string> = {
    professional: "专业风格",
    lifestyle: "生活风格",
    minimal: "极简风格",
    luxury: "奢华风格",
  };

  return {
    totalGenerations: totalResult?.count || 0,
    thisMonth: monthResult?.count || 0,
    remainingCredits: limit - used,
    favoriteStyle: styleNames[styleResult?.style || "professional"] || "专业风格",
  };
}