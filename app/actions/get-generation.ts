"use server";

import { headers } from "next/headers";
import { getCloudflareContext } from "@/lib/cloudflare-context";
import { createDb, schema } from "@/db";
import { type GenerationResult, type GenerationSettings } from "@/db/schema";
import { getCurrentUser, createAuth } from "@/lib/auth";
import { eq, and, sql } from "drizzle-orm";

/**
 * 生成任务详情响应
 */
export interface GetGenerationResponse {
  success: boolean;
  data?: {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    productImage: {
      id: string;
      url: string;
      originalName: string;
    };
    referenceImages?: Array<{
      id: string;
      url: string;
      originalName: string;
    }>;
    prompt?: string;
    settings: GenerationSettings;
    results?: GenerationResult[];
    errorMessage?: string;
    progress?: number;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
  };
  error?: string;
}

/**
 * 获取生成任务详情
 * @param generationId 生成任务ID
 * @returns 生成任务详情
 */
export async function getGeneration(
  generationId: string
): Promise<GetGenerationResponse> {
  try {
    const { env } = await getCloudflareContext();

    // 验证用户 - 使用真实的请求头
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const request = new Request("http://localhost", {
      headers: { cookie },
    });

    const auth = createAuth(env.DB, env);
    const user = await getCurrentUser(auth, request);

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = createDb(env.DB);

    // 查询生成任务
    const generation = await db.query.generations.findFirst({
      where: and(
        eq(schema.generations.id, generationId),
        eq(schema.generations.userId, user.id)
      ),
    });

    if (!generation) {
      return { success: false, error: "Generation not found" };
    }

    // 查询商品图片
    const productImage = await db.query.images.findFirst({
      where: eq(schema.images.id, generation.productImageId || ""),
    });

    if (!productImage) {
      return { success: false, error: "Product image not found" };
    }

    // 查询参考图片
    let referenceImages: Array<{
      id: string;
      url: string;
      originalName: string;
    }> = [];

    if (generation.referenceImageIds && generation.referenceImageIds.length > 0) {
      const refs = await db.query.images.findMany({
        where: and(
          eq(schema.images.userId, user.id),
          eq(schema.images.isDeleted, false)
        ),
      });

      referenceImages = refs
        .filter((img) => generation.referenceImageIds?.includes(img.id))
        .map((img) => ({
          id: img.id,
          url: img.url,
          originalName: img.originalName,
        }));
    }

    // 计算进度
    const progress = calculateProgress(
      generation.status as "pending" | "processing" | "completed" | "failed",
      generation.createdAt,
      generation.updatedAt,
      generation.results?.length || 0,
      generation.settings?.count || 3
    );

    return {
      success: true,
      data: {
        id: generation.id,
        status: generation.status as
          | "pending"
          | "processing"
          | "completed"
          | "failed",
        productImage: {
          id: productImage.id,
          url: productImage.url,
          originalName: productImage.originalName,
        },
        referenceImages:
          referenceImages.length > 0 ? referenceImages : undefined,
        prompt: generation.prompt || undefined,
        settings: generation.settings || {},
        results: generation.results || undefined,
        errorMessage: generation.errorMessage || undefined,
        progress,
        createdAt: generation.createdAt,
        updatedAt: generation.updatedAt,
        completedAt: generation.completedAt || undefined,
      },
    };
  } catch (error) {
    console.error("Get generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get generation",
    };
  }
}

/**
 * 计算生成进度
 */
function calculateProgress(
  status: "pending" | "processing" | "completed" | "failed",
  createdAt: Date,
  updatedAt: Date,
  currentResults: number,
  targetCount: number
): number {
  switch (status) {
    case "pending":
      return 0;
    case "completed":
      return 100;
    case "failed":
      return 0;
    case "processing": {
      // 基于结果数量和时间的混合计算
      const resultProgress = Math.min(
        (currentResults / targetCount) * 80,
        80
      );

      // 基于时间的进度(最多 19%)
      const elapsed = Date.now() - createdAt.getTime();
      const estimatedDuration = targetCount * 5000 + 3000; // 粗略估计
      const timeProgress = Math.min((elapsed / estimatedDuration) * 19, 19);

      return Math.floor(resultProgress + timeProgress + 1);
    }
    default:
      return 0;
  }
}

/**
 * 重新生成
 * @param generationId 原生成任务ID
 * @returns 新的生成任务
 */
export async function retryGeneration(
  generationId: string
): Promise<{
  success: boolean;
  data?: { id: string };
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

    const auth = createAuth(env.DB, env);
    const user = await getCurrentUser(auth, request);

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = createDb(env.DB);

    // 查询原任务
    const generation = await db.query.generations.findFirst({
      where: and(
        eq(schema.generations.id, generationId),
        eq(schema.generations.userId, user.id)
      ),
    });

    if (!generation) {
      return { success: false, error: "Generation not found" };
    }

    // 只有失败的任务可以重试
    if (generation.status !== "failed") {
      return {
        success: false,
        error: "Only failed generations can be retried",
      };
    }

    // 重新创建任务
    const { createGeneration } = await import("./create-generation");
    return createGeneration({
      productImageId: generation.productImageId || "",
      referenceImageIds: generation.referenceImageIds || [],
      prompt: generation.prompt || undefined,
      settings: generation.settings || {},
    });
  } catch (error) {
    console.error("Retry generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to retry generation",
    };
  }
}

/**
 * 取消生成任务
 * @param generationId 生成任务ID
 * @returns 操作结果
 */
export async function cancelGeneration(
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

    const auth = createAuth(env.DB, env);
    const user = await getCurrentUser(auth, request);

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = createDb(env.DB);

    // 查询任务
    const generation = await db.query.generations.findFirst({
      where: and(
        eq(schema.generations.id, generationId),
        eq(schema.generations.userId, user.id)
      ),
    });

    if (!generation) {
      return { success: false, error: "Generation not found" };
    }

    // 只能取消待处理或处理中的任务
    if (generation.status !== "pending" && generation.status !== "processing") {
      return {
        success: false,
        error: "Cannot cancel completed or failed generation",
      };
    }

    // 更新状态为失败(表示已取消)
    await db
      .update(schema.generations)
      .set({
        status: "failed",
        errorMessage: "Cancelled by user",
        updatedAt: new Date(),
      })
      .where(eq(schema.generations.id, generationId));

    // 退还可以额度
    const cost =
      (generation.settings?.count || 3) *
      (1 + (generation.referenceImageIds?.length || 0));

    await db
      .update(schema.subscriptions)
      .set({
        usedGenerations: sql`MAX(0, ${schema.subscriptions.usedGenerations} - ${cost})`,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.userId, user.id));

    return { success: true };
  } catch (error) {
    console.error("Cancel generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel generation",
    };
  }
}