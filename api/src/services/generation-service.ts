/**
 * Generations Service
 *
 * Business logic for generation tasks
 */

import { eq, and, gte, desc, sql, count, inArray } from "drizzle-orm";
import { createDb, schema, type GenerationSettings, type GenerationResult } from "@oura-pix/database";
import { generateProductCopy } from "./geminiService";
import { notifyGenerationComplete, notifyGenerationFailed } from "./notificationService";

export type TimeFilter = "all" | "today" | "week" | "month";

export interface GenerationRecord {
  id: string;
  prompt: string | null;
  teamId: string | null;
  platform: string;
  style: string;
  language: string;
  count: number;
  productImageId: string | null;
  productImageUrl: string | null;
  productImage: {
    id: string;
    url: string;
    originalName: string;
  } | null;
  referenceImageUrls: string[];
  referenceImages: Array<{
    id: string;
    url: string;
    originalName: string;
  }>;
  results: GenerationResult[] | null;
  generatedImages: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  status: string;
  processingStage?: string | null;
  imageGenerationStatus?: string | null;
  imageGenerationError?: string | null;
  generatedImageCount?: number | null;
  errorMessage?: string | null;
}

export interface GenerationListParams {
  page?: number;
  pageSize?: number;
  filter?: TimeFilter;
  userId: string;
}

export interface GenerationListResponse {
  data: GenerationRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStats {
  totalGenerations: number;
  thisMonth: number;
  remainingCredits: number;
  favoriteStyle: string;
}

function getFilterStartDate(filter: TimeFilter): Date | null {
  const now = new Date();

  switch (filter) {
    case "today":
      return new Date(now.setHours(0, 0, 0, 0));
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return null;
  }
}

function transformRecord(
  record: typeof schema.generations.$inferSelect,
  productImage: typeof schema.images.$inferSelect | null,
  referenceImages: typeof schema.images.$inferSelect[]
): GenerationRecord {
  const settings = record.settings as GenerationSettings | null;
  const results = record.results as GenerationResult[] | null;

  return {
    id: record.id,
    prompt: record.prompt,
    teamId: record.teamId,
    platform: settings?.targetPlatform || "generic",
    style: settings?.style || "professional",
    language: settings?.language || "en",
    count: settings?.count || results?.length || 0,
    productImageId: record.productImageId,
    productImageUrl: productImage?.url || null,
    productImage: productImage
      ? {
          id: productImage.id,
          url: productImage.url,
          originalName: productImage.originalName,
        }
      : null,
    referenceImageUrls: referenceImages.map((img) => img.url),
    referenceImages: referenceImages.map((img) => ({
      id: img.id,
      url: img.url,
      originalName: img.originalName,
    })),
    results,
    generatedImages: results?.map((r) => r.imageUrl!).filter(Boolean) || [],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    completedAt: record.completedAt,
    status: record.status,
    processingStage: record.processingStage,
    imageGenerationStatus: record.imageGenerationStatus,
    imageGenerationError: record.imageGenerationError,
    generatedImageCount: record.generatedImageCount,
    errorMessage: record.errorMessage,
  };
}

export async function getGenerationsList(
  db: ReturnType<typeof createDb>,
  params: GenerationListParams
): Promise<GenerationListResponse> {
  const { page = 1, pageSize = 10, filter = "all", userId } = params;

  const startDate = getFilterStartDate(filter);

  const baseCondition = startDate
    ? and(eq(schema.generations.userId, userId), gte(schema.generations.createdAt, startDate))
    : eq(schema.generations.userId, userId);

  const countResult = await db
    .select({ count: count() })
    .from(schema.generations)
    .where(baseCondition);

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / pageSize);

  const offset = (page - 1) * pageSize;
  const records = await db.query.generations.findMany({
    where: baseCondition,
    orderBy: [desc(schema.generations.createdAt)],
    limit: pageSize,
    offset: offset,
  });

  const allProductImageIds = records.map((r) => r.productImageId).filter(Boolean) as string[];
  const allReferenceImageIds = records.flatMap(
    (r) => (r.referenceImageIds as string[] | null) ?? []
  );
  const allImageIds = [...new Set([...allProductImageIds, ...allReferenceImageIds])];

  const imageMap = new Map<string, typeof schema.images.$inferSelect>();
  if (allImageIds.length > 0) {
    const allImages = await db.query.images.findMany({
      where: inArray(schema.images.id, allImageIds),
    });
    allImages.forEach((img) => imageMap.set(img.id, img));
  }

  const transformedData: GenerationRecord[] = [];

  for (const record of records) {
    const productImage = record.productImageId
      ? imageMap.get(record.productImageId) ?? null
      : null;
    const refIds = record.referenceImageIds as string[] | null;
    const referenceImages = refIds
      ? refIds.map((id) => imageMap.get(id)).filter(Boolean) as typeof schema.images.$inferSelect[]
      : [];

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

export async function getGenerationById(
  db: ReturnType<typeof createDb>,
  id: string,
  userId: string
): Promise<GenerationRecord | null> {
  const record = await db.query.generations.findFirst({
    where: and(eq(schema.generations.id, id), eq(schema.generations.userId, userId)),
  });

  if (!record) {
    return null;
  }

  let productImage: typeof schema.images.$inferSelect | null = null;
  let referenceImages: typeof schema.images.$inferSelect[] = [];

  if (record.productImageId) {
    productImage = await db.query.images.findFirst({
      where: eq(schema.images.id, record.productImageId),
    }) ?? null;
  }

  const refIds = record.referenceImageIds as string[] | null;
  if (refIds && refIds.length > 0) {
    referenceImages = await db.query.images.findMany({
      where: inArray(schema.images.id, refIds),
    });
  }

  return transformRecord(record, productImage, referenceImages);
}

export async function deleteGeneration(
  db: ReturnType<typeof createDb>,
  id: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const record = await db.query.generations.findFirst({
    where: and(eq(schema.generations.id, id), eq(schema.generations.userId, userId)),
    columns: { id: true },
  });

  if (!record) {
    return { success: false, error: "Record not found" };
  }

  await db.delete(schema.generations).where(eq(schema.generations.id, id));

  return { success: true };
}

export async function cancelGeneration(
  db: ReturnType<typeof createDb>,
  id: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const record = await db.query.generations.findFirst({
    where: and(eq(schema.generations.id, id), eq(schema.generations.userId, userId)),
  });

  if (!record) {
    return { success: false, error: "Record not found" };
  }
  if (record.status === "completed") {
    return { success: false, error: "Completed generation cannot be cancelled" };
  }

  await db
    .update(schema.generations)
    .set({
      status: "failed",
      errorMessage: "Generation cancelled",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.generations.id, id));

  return { success: true };
}

export async function getUserStats(
  db: ReturnType<typeof createDb>,
  userId: string
): Promise<UserStats> {
  const totalResult = await db
    .select({ count: count() })
    .from(schema.generations)
    .where(eq(schema.generations.userId, userId));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthResult = await db
    .select({ count: count() })
    .from(schema.generations)
    .where(and(eq(schema.generations.userId, userId), gte(schema.generations.createdAt, monthStart)));

  const styleResult = await db
    .select({
      style: sql<string>`json_extract(${schema.generations.settings}, '$.style')`,
      count: count(),
    })
    .from(schema.generations)
    .where(and(eq(schema.generations.userId, userId), sql`${schema.generations.settings} IS NOT NULL`))
    .groupBy(sql`json_extract(${schema.generations.settings}, '$.style')`)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  const subResult = await db.query.subscriptions.findFirst({
    where: eq(schema.subscriptions.userId, userId),
    columns: {
      generationLimit: true,
      usedGenerations: true,
    },
  });

  const limit = subResult?.generationLimit ?? 10;
  const used = subResult?.usedGenerations ?? 0;

  const validStyles = ["professional", "lifestyle", "minimal", "luxury"] as const;
  const rawStyle = styleResult[0]?.style;
  const favoriteStyle = validStyles.includes(rawStyle as typeof validStyles[number])
    ? rawStyle ?? "professional"
    : "professional";

  return {
    totalGenerations: totalResult[0]?.count || 0,
    thisMonth: monthResult[0]?.count || 0,
    remainingCredits: limit - used,
    favoriteStyle,
  };
}

export async function createGeneration(
  db: ReturnType<typeof createDb>,
  userId: string,
  input: {
    productImageId: string;
    referenceImageIds?: string[];
    prompt?: string;
    settings: GenerationSettings;
    teamId?: string;
  }
): Promise<typeof schema.generations.$inferSelect> {
  const [generation] = await db
    .insert(schema.generations)
    .values({
      userId,
      teamId: input.teamId,
      productImageId: input.productImageId,
      referenceImageIds: input.referenceImageIds || [],
      prompt: input.prompt,
      settings: input.settings,
      status: "pending",
      processingStage: "analyzing",
      stageStartedAt: new Date(),
    })
    .returning();

  return generation!;
}

export interface GenerationRuntimeEnv {
  DB: D1Database;
  GEMINI_API_KEY?: string;
  GEMINI_BASE_URL?: string;
  GEMINI_MODEL?: string;
}

export async function processGeneration(
  env: GenerationRuntimeEnv,
  generationId: string
): Promise<void> {
  const db = createDb(env.DB);
  const record = await db.query.generations.findFirst({
    where: eq(schema.generations.id, generationId),
  });

  if (!record || record.status !== "pending") return;

  const now = new Date();
  await db
    .update(schema.generations)
    .set({
      status: "processing",
      processingStage: "generating_text",
      stageStartedAt: now,
      imageGenerationStatus: record.settings?.generateImages ? "pending" : "skipped",
      updatedAt: now,
    })
    .where(eq(schema.generations.id, generationId));

  try {
    const productImage = record.productImageId
      ? await db.query.images.findFirst({ where: eq(schema.images.id, record.productImageId) })
      : null;
    const referenceIds = (record.referenceImageIds as string[] | null) ?? [];
    const referenceImages = referenceIds.length
      ? await db.query.images.findMany({ where: inArray(schema.images.id, referenceIds) })
      : [];

    const settings = record.settings as GenerationSettings;
    const results = await generateProductCopy({
      env,
      productImage: productImage
        ? { url: productImage.url, mimeType: productImage.mimeType }
        : null,
      referenceImages: referenceImages.map((image) => ({
        url: image.url,
        mimeType: image.mimeType,
      })),
      prompt: record.prompt,
      settings,
    });

    const completedAt = new Date();
    await db
      .update(schema.generations)
      .set({
        status: "completed",
        processingStage: "completed",
        results,
        generatedImageCount: results.filter((result) => Boolean(result.imageUrl)).length,
        imageGenerationStatus: "skipped",
        imageGenerationError: settings.generateImages
          ? "Image generation is not configured in the current Worker pipeline; text assets were generated."
          : null,
        completedAt,
        updatedAt: completedAt,
      })
      .where(eq(schema.generations.id, generationId));

    await notifyGenerationComplete(db, record.userId, generationId, results.length).catch((error) => {
      console.error("[Generation] Completion notification failed:", error);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    const failedAt = new Date();
    await db
      .update(schema.generations)
      .set({
        status: "failed",
        processingStage: "generating_text",
        imageGenerationStatus: "failed",
        errorMessage: message,
        imageGenerationError: message,
        completedAt: failedAt,
        updatedAt: failedAt,
      })
      .where(eq(schema.generations.id, generationId));

    await notifyGenerationFailed(db, record.userId, generationId, message).catch((notifyError) => {
      console.error("[Generation] Failure notification failed:", notifyError);
    });
  }
}
