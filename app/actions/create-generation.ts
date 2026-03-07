"use server";

import { headers } from "next/headers";
import { getCloudflareContext } from "@/lib/cloudflare-context";
import { createDb, schema } from "@/db";
import { getCurrentUser, createAuth } from "@/lib/auth";
import { type GenerationSettings } from "@/db/schema";
import {
  generateProductDetails,
  validateGenerationSettings,
  analyzeImage,
} from "@/lib/ai-generation";
import { generateSceneImages } from "@/lib/ai/imagen";
import { uploadGeneratedImagesToR2 } from "@/lib/r2-image-upload";
import { calculateGenerationCost } from "@/lib/quota";
import { logger } from "@/lib/logger";
import { updateProcessingStage } from "@/lib/task-queue";
import { eq, and, sql } from "drizzle-orm";

/**
 * 创建生成任务请求
 */
export interface CreateGenerationRequest {
  productImageId: string;
  referenceImageIds?: string[];
  prompt?: string;
  settings?: Partial<GenerationSettings>;
}

/**
 * 创建生成任务响应
 */
export interface CreateGenerationResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    estimatedTime: number;
  };
  error?: string;
}

/**
 * 检查用户生成配额
 * @param db 数据库实例
 * @param userId 用户ID
 * @param cost 预估消耗
 * @returns 是否有足够配额
 */
async function checkQuota(
  db: ReturnType<typeof createDb>,
  userId: string,
  cost: number
): Promise<{ allowed: boolean; remaining: number }> {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
  });

  if (!subscription) {
    return { allowed: false, remaining: 0 };
  }

  const remaining = subscription.generationLimit - subscription.usedGenerations;
  return { allowed: remaining >= cost, remaining };
}

/**
 * 更新用户配额
 * @param db 数据库实例
 * @param userId 用户ID
 * @param cost 消耗数量
 */
async function deductQuota(
  db: ReturnType<typeof createDb>,
  userId: string,
  cost: number
): Promise<void> {
  await db
    .update(schema.subscriptions)
    .set({
      usedGenerations: sql`${schema.subscriptions.usedGenerations} + ${cost}`,
      updatedAt: new Date(),
    })
    .where(eq(schema.subscriptions.userId, userId));
}

/**
 * 创建生成任务
 * @param request 生成请求
 * @returns 创建结果
 */
export async function createGeneration(
  request: CreateGenerationRequest
): Promise<CreateGenerationResponse> {
  try {
    const { env } = await getCloudflareContext();

    // 验证用户 - 使用真实的请求头
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const httpRequest = new Request("http://localhost", {
      headers: { cookie },
    });

    const auth = createAuth(env.DB, env);
    const user = await getCurrentUser(auth, httpRequest);

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = createDb(env.DB);

    // 验证商品图片
    const productImage = await db.query.images.findFirst({
      where: and(
        eq(schema.images.id, request.productImageId),
        eq(schema.images.userId, user.id),
        eq(schema.images.isDeleted, false)
      ),
    });

    if (!productImage) {
      return { success: false, error: "Product image not found" };
    }

    // 验证参考图片(如果有)
    if (request.referenceImageIds && request.referenceImageIds.length > 0) {
      const referenceImages = await db.query.images.findMany({
        where: and(
          eq(schema.images.userId, user.id),
          eq(schema.images.isDeleted, false)
        ),
      });

      const validIds = new Set(referenceImages.map((img) => img.id));
      const invalidIds = request.referenceImageIds.filter(
        (id) => !validIds.has(id)
      );

      if (invalidIds.length > 0) {
        return {
          success: false,
          error: `Invalid reference image IDs: ${invalidIds.join(", ")}`,
        };
      }
    }

    // 验证并规范化设置
    const settings = validateGenerationSettings(request.settings || {});

    // 计算预估消耗
    const imageCount = 1 + (request.referenceImageIds?.length || 0);
    const cost = calculateGenerationCost({
      imageCount,
      generationCount: settings.count || 3,
      includeImageGen: settings.generateImages,
      imageGenCount: settings.imageCount || 5,
    });

    // 检查配额
    const quotaCheck = await checkQuota(db, user.id, cost);
    if (!quotaCheck.allowed) {
      return {
        success: false,
        error: `Insufficient quota. Required: ${cost}, Remaining: ${quotaCheck.remaining}`,
      };
    }

    // 扣除配额
    await deductQuota(db, user.id, cost);

    // 创建生成任务
    const generationData = {
      userId: user.id,
      status: "pending" as const,
      productImageId: request.productImageId,
      referenceImageIds: request.referenceImageIds || [],
      prompt: request.prompt,
      settings: settings,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const [generation] = await db
      .insert(schema.generations)
      .values(generationData)
      .returning();

    // 记录使用日志
    await db.insert(schema.usageLogs).values({
      userId: user.id,
      type: "generation" as const,
      generationId: generation.id,
      creditsUsed: cost,
      details: {
        productImageId: request.productImageId,
        referenceImageCount: request.referenceImageIds?.length || 0,
        settings,
      },
    });

    // 异步执行生成任务
    processGeneration(generation.id, env.DB).catch((err) => {
      logger.error("Process generation failed", err);
    });

    return {
      success: true,
      data: {
        id: generation.id,
        status: "pending",
        estimatedTime: estimateGenerationTime(imageCount, settings.count || 3),
      },
    };
  } catch (error) {
    logger.error("Create generation error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create generation",
    };
  }
}

/**
 * 估算生成时间(秒)
 */
function estimateGenerationTime(imageCount: number, generationCount: number): number {
  // 图片分析时间 + 生成时间
  const analysisTime = imageCount * 3;
  const generationTime = generationCount * 5;
  return analysisTime + generationTime;
}

/**
 * 处理生成任务
 * @param generationId 生成任务ID
 * @param d1Database D1 数据库实例
 */
async function processGeneration(
  generationId: string,
  d1Database: typeof import("@cloudflare/workers-types").D1Database.prototype
): Promise<void> {
  const db = createDb(d1Database);

  try {
    // 更新状态为处理中 - 分析阶段
    await db
      .update(schema.generations)
      .set({
        status: "processing",
        updatedAt: new Date(),
      })
      .where(eq(schema.generations.id, generationId));

    // 阶段 1: 分析产品图片
    await updateProcessingStage(db, generationId, "analyzing");
    const generation = await db.query.generations.findFirst({
      where: eq(schema.generations.id, generationId),
    });

    if (!generation) {
      throw new Error("Generation not found");
    }

    // 获取产品图片
    const productImage = generation.productImageId
      ? await db.query.images.findFirst({
          where: eq(schema.images.id, generation.productImageId),
        })
      : null;

    if (!productImage) {
      throw new Error("Product image not found");
    }

    // 获取参考图片URL
    let referenceImageUrls: string[] = [];
    const refImageIds = generation.referenceImageIds || [];
    if (refImageIds.length > 0) {
      const referenceImages = await db.query.images.findMany({
        where: and(
          eq(schema.images.userId, generation.userId),
          eq(schema.images.isDeleted, false)
        ),
      });

      referenceImageUrls = referenceImages
        .filter((img) => refImageIds.includes(img.id))
        .map((img) => img.url);
    }

    const genSettings = generation.settings || {};

    // 阶段 1: 分析产品图片
    const analysis = await analyzeImage(productImage.url);

    // 阶段 2: 生成文本内容
    await updateProcessingStage(db, generationId, "generating_text");
    const results = await generateProductDetails({
      productImageUrl: productImage.url,
      referenceImageUrls,
      prompt: generation.prompt || undefined,
      settings: genSettings || {},
    });

    // 阶段 3: 生成场景图 (如果启用)
    if (genSettings?.generateImages) {
      try {
        // 更新图像生成状态
        await updateProcessingStage(db, generationId, "generating_images");
        await db
          .update(schema.generations)
          .set({
            imageGenerationStatus: "processing",
            updatedAt: new Date(),
          })
          .where(eq(schema.generations.id, generationId));

        // 生成场景图
        const sceneImages = await generateSceneImages({
          productAnalysis: analysis,
          settings: genSettings,
          count: genSettings.imageCount || 5,
          userPrompt: generation.prompt || undefined,
          options: {
            aspectRatio: genSettings.aspectRatio,
            allowPersons: genSettings.allowPersons,
          },
        });

        // 上传到 R2
        await updateProcessingStage(db, generationId, "uploading");
        const uploadedImages = await uploadGeneratedImagesToR2(
          sceneImages,
          generationId,
          generation.userId,
          genSettings.aspectRatio || "1:1"
        );

        // 将场景图关联到每个生成结果
        const imagesPerResult = Math.ceil(uploadedImages.length / results.length);
        results.forEach((result, index) => {
          const startIdx = index * imagesPerResult;
          const endIdx = Math.min(startIdx + imagesPerResult, uploadedImages.length);
          result.sceneImages = uploadedImages.slice(startIdx, endIdx);
        });

        // 更新图像生成状态为完成
        await db
          .update(schema.generations)
          .set({
            imageGenerationStatus: "completed",
            generatedImageCount: uploadedImages.length,
            updatedAt: new Date(),
          })
          .where(eq(schema.generations.id, generationId));

      } catch (imageError) {
        logger.error("Image generation failed", imageError);

        // 图像生成失败,但不影响整体任务
        await db
          .update(schema.generations)
          .set({
            imageGenerationStatus: "failed",
            imageGenerationError: imageError instanceof Error ? imageError.message : "Unknown error",
            updatedAt: new Date(),
          })
          .where(eq(schema.generations.id, generationId));

        // 继续完成任务,只是没有场景图
      }
    } else {
      // 未启用图像生成
      await db
        .update(schema.generations)
        .set({
          imageGenerationStatus: "skipped",
          updatedAt: new Date(),
        })
        .where(eq(schema.generations.id, generationId));
    }

    // 更新任务为完成
    await updateProcessingStage(db, generationId, "completed");
    await db
      .update(schema.generations)
      .set({
        status: "completed",
        results: results,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.generations.id, generationId));

  } catch (error) {
    logger.error("Generation processing error", error);

    // 更新任务为失败
    await db
      .update(schema.generations)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date(),
      })
      .where(eq(schema.generations.id, generationId));
  }
}