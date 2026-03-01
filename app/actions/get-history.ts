"use server";

import { headers } from "next/headers";
import { getCloudflareContext } from "@/lib/cloudflare-context";
import { createDb, schema } from "@/db";
import { type GenerationStatusType } from "@/db/schema";
import { getCurrentUser, createAuth } from "@/lib/auth";
import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";

/**
 * 历史记录查询参数
 */
export interface GetHistoryRequest {
  page?: number;
  pageSize?: number;
  status?: GenerationStatusType;
  startDate?: Date;
  endDate?: Date;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

/**
 * 历史记录列表项
 */
export interface HistoryItem {
  id: string;
  status: string;
  productImage: {
    id: string;
    url: string;
    originalName: string;
  };
  referenceImageCount: number;
  prompt?: string;
  resultsCount: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * 历史记录响应
 */
export interface GetHistoryResponse {
  success: boolean;
  data?: {
    items: HistoryItem[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    stats: {
      totalGenerations: number;
      completedCount: number;
      failedCount: number;
      pendingCount: number;
    };
  };
  error?: string;
}

/**
 * 获取生成历史记录
 * @param params 查询参数
 * @returns 历史记录列表
 */
export async function getHistory(
  params: GetHistoryRequest = {}
): Promise<GetHistoryResponse> {
  try {
    const { env } = await getCloudflareContext();

    // 验证用户 - 使用真实的请求头
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const request = new Request("http://localhost", {
      headers: { cookie },
    });

    const auth = createAuth(env.DB);
    const user = await getCurrentUser(auth, request);

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = createDb(env.DB);

    // 默认值
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(Math.max(1, params.pageSize || 10), 50);
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [eq(schema.generations.userId, user.id)];

    if (params.status) {
      conditions.push(eq(schema.generations.status, params.status));
    }

    if (params.startDate) {
      conditions.push(
        gte(schema.generations.createdAt, params.startDate)
      );
    }

    if (params.endDate) {
      conditions.push(lte(schema.generations.createdAt, params.endDate));
    }

    // 排序
    const sortColumn =
      params.sortBy === "updatedAt"
        ? schema.generations.updatedAt
        : schema.generations.createdAt;
    const orderFn = params.sortOrder === "asc" ? asc : desc;

    // 查询总数
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(schema.generations)
      .where(and(...conditions));

    const total = countResult[0]?.count || 0;

    // 查询数据
    const generations = await db.query.generations.findMany({
      where: and(...conditions),
      orderBy: [orderFn(sortColumn)],
      limit: pageSize,
      offset,
    });

    // 获取关联的商品图片
    const productImageIds = generations
      .map((g) => g.productImageId)
      .filter((id): id is string => !!id);

    const productImages =
      productImageIds.length > 0
        ? await db.query.images.findMany({
            where: and(
              eq(schema.images.userId, user.id),
              sql`${schema.images.id} IN (${sql.join(
                productImageIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            ),
          })
        : [];

    const imageMap = new Map(productImages.map((img) => [img.id, img]));

    // 构建响应数据
    const items: HistoryItem[] = generations.map((gen) => {
      const productImage = gen.productImageId
        ? imageMap.get(gen.productImageId)
        : null;

      return {
        id: gen.id,
        status: gen.status,
        productImage: productImage
          ? {
              id: productImage.id,
              url: productImage.url,
              originalName: productImage.originalName,
            }
          : {
              id: "",
              url: "",
              originalName: "Unknown",
            },
        referenceImageCount: gen.referenceImageIds?.length || 0,
        prompt: gen.prompt || undefined,
        resultsCount: gen.results?.length || 0,
        createdAt: gen.createdAt,
        updatedAt: gen.updatedAt,
        completedAt: gen.completedAt || undefined,
      };
    });

    // 统计信息
    const stats = await getGenerationStats(db, user.id);

    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        stats,
      },
    };
  } catch (error) {
    console.error("Get history error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get history",
    };
  }
}

/**
 * 获取生成统计信息
 */
async function getGenerationStats(
  db: ReturnType<typeof createDb>,
  userId: string
): Promise<{
  totalGenerations: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
}> {
  const stats = await db
    .select({
      status: schema.generations.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(schema.generations)
    .where(eq(schema.generations.userId, userId))
    .groupBy(schema.generations.status);

  const result = {
    totalGenerations: 0,
    completedCount: 0,
    failedCount: 0,
    pendingCount: 0,
  };

  for (const stat of stats) {
    result.totalGenerations += stat.count;
    switch (stat.status) {
      case "completed":
        result.completedCount = stat.count;
        break;
      case "failed":
        result.failedCount = stat.count;
        break;
      case "pending":
      case "processing":
        result.pendingCount += stat.count;
        break;
    }
  }

  return result;
}

/**
 * 获取最近生成记录
 * @param limit 数量限制
 * @returns 最近生成记录
 */
export async function getRecentGenerations(
  limit: number = 5
): Promise<{
  success: boolean;
  data?: HistoryItem[];
  error?: string;
}> {
  const result = await getHistory({
    page: 1,
    pageSize: limit,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return {
    success: true,
    data: result.data?.items,
  };
}

/**
 * 删除生成记录
 * @param generationId 生成任务ID
 * @returns 操作结果
 */
export async function deleteGeneration(
  generationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { env } = await getCloudflareContext();

    // 验证用户 - 使用真实的请求头
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const request = new Request("http://localhost", {
      headers: { cookie },
    });

    const auth = createAuth(env.DB);
    const user = await getCurrentUser(auth, request);

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = createDb(env.DB);

    // 验证所有权
    const generation = await db.query.generations.findFirst({
      where: and(
        eq(schema.generations.id, generationId),
        eq(schema.generations.userId, user.id)
      ),
    });

    if (!generation) {
      return { success: false, error: "Generation not found" };
    }

    // 删除关联的使用日志
    await db
      .delete(schema.usageLogs)
      .where(eq(schema.usageLogs.generationId, generationId));

    // 删除生成记录
    await db
      .delete(schema.generations)
      .where(eq(schema.generations.id, generationId));

    return { success: true };
  } catch (error) {
    console.error("Delete generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete generation",
    };
  }
}

/**
 * 导出历史记录
 * @param params 查询参数
 * @returns CSV 格式的历史记录
 */
export async function exportHistory(
  params: Omit<GetHistoryRequest, "page" | "pageSize"> = {}
): Promise<{
  success: boolean;
  data?: { csv: string; filename: string };
  error?: string;
}> {
  try {
    const { env } = await getCloudflareContext();

    // 验证用户 - 使用真实的请求头
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const request = new Request("http://localhost", {
      headers: { cookie },
    });

    const auth = createAuth(env.DB);
    const user = await getCurrentUser(auth, request);

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = createDb(env.DB);

    // 构建查询条件
    const conditions = [eq(schema.generations.userId, user.id)];

    if (params.status) {
      conditions.push(eq(schema.generations.status, params.status));
    }

    if (params.startDate) {
      conditions.push(gte(schema.generations.createdAt, params.startDate));
    }

    if (params.endDate) {
      conditions.push(lte(schema.generations.createdAt, params.endDate));
    }

    // 查询所有数据
    const generations = await db.query.generations.findMany({
      where: and(...conditions),
      orderBy:
        params.sortOrder === "asc"
          ? [asc(schema.generations.createdAt)]
          : [desc(schema.generations.createdAt)],
    });

    // 生成 CSV
    const csvHeaders = [
      "ID",
      "Status",
      "Product Image",
      "Reference Images",
      "Prompt",
      "Results Count",
      "Created At",
      "Completed At",
    ];

    const rows = generations.map((gen) => [
      gen.id,
      gen.status,
      gen.productImageId || "",
      (gen.referenceImageIds?.length || 0).toString(),
      `"${(gen.prompt || "").replace(/"/g, '""')}"`,
      (gen.results?.length || 0).toString(),
      gen.createdAt.toISOString(),
      gen.completedAt?.toISOString() || "",
    ]);

    const csv = [csvHeaders.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const filename = `ourapix-history-${new Date().toISOString().split("T")[0]}.csv`;

    return {
      success: true,
      data: { csv, filename },
    };
  } catch (error) {
    console.error("Export history error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to export history",
    };
  }
}