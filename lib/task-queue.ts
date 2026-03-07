/**
 * 生成任务队列
 * 提供任务持久化和状态跟踪功能
 * 用于解决 Worker 重启时任务丢失的问题
 */

import { eq, and, lt, sql } from "drizzle-orm";
import { createDb, schema } from "@/db";
import { logger } from "@/lib/logger";
import type { ProcessingStageType } from "@/db/schema";

/**
 * 任务状态
 */
export interface JobStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  processingStage?: ProcessingStageType;
  stageStartedAt?: Date;
  errorMessage?: string;
  updatedAt: Date;
}

/**
 * 阶段超时配置(毫秒)
 */
const STAGE_TIMEOUTS: Record<ProcessingStageType, number> = {
  analyzing: 2 * 60 * 1000,      // 2分钟
  generating_text: 3 * 60 * 1000, // 3分钟
  generating_images: 10 * 60 * 1000, // 10分钟
  uploading: 2 * 60 * 1000,      // 2分钟
  completed: 0,                  // 无超时
};

/**
 * 更新任务处理阶段
 * @param db 数据库实例
 * @param generationId 生成任务ID
 * @param stage 处理阶段
 */
export async function updateProcessingStage(
  db: ReturnType<typeof createDb>,
  generationId: string,
  stage: ProcessingStageType
): Promise<void> {
  try {
    await db
      .update(schema.generations)
      .set({
        processingStage: stage,
        stageStartedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.generations.id, generationId));

    logger.debug("Updated processing stage", { generationId, stage });
  } catch (error) {
    logger.error("Failed to update processing stage", { generationId, stage, error });
    throw error;
  }
}

/**
 * 获取任务状态
 * @param db 数据库实例
 * @param generationId 生成任务ID
 * @returns 任务状态
 */
export async function getJobStatus(
  db: ReturnType<typeof createDb>,
  generationId: string
): Promise<JobStatus | null> {
  try {
    const generation = await db.query.generations.findFirst({
      where: eq(schema.generations.id, generationId),
      columns: {
        id: true,
        status: true,
        processingStage: true,
        stageStartedAt: true,
        errorMessage: true,
        updatedAt: true,
      },
    });

    if (!generation) {
      return null;
    }

    return {
      id: generation.id,
      status: generation.status as JobStatus["status"],
      processingStage: generation.processingStage as ProcessingStageType | undefined,
      stageStartedAt: generation.stageStartedAt,
      errorMessage: generation.errorMessage || undefined,
      updatedAt: generation.updatedAt,
    };
  } catch (error) {
    logger.error("Failed to get job status", { generationId, error });
    return null;
  }
}

/**
 * 查找超时任务
 * 处理中超时 5 分钟的任务会被视为需要恢复
 * @param db 数据库实例
 * @param timeoutMinutes 超时时间(分钟),默认5分钟
 * @returns 超时任务列表
 */
export async function findStaleJobs(
  db: ReturnType<typeof createDb>,
  timeoutMinutes: number = 5
): Promise<Array<{ id: string; processingStage?: ProcessingStageType; stageStartedAt?: Date }>> {
  try {
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const cutoffTime = new Date(Date.now() - timeoutMs);

    const staleJobs = await db.query.generations.findMany({
      where: and(
        eq(schema.generations.status, "processing"),
        // 阶段开始时间超过阈值,或者没有阶段信息(旧数据)
        sql`(${schema.generations.stageStartedAt} IS NULL OR ${schema.generations.stageStartedAt} < ${cutoffTime})`
      ),
      columns: {
        id: true,
        processingStage: true,
        stageStartedAt: true,
      },
    });

    logger.info("Found stale jobs", { count: staleJobs.length, timeoutMinutes });
    return staleJobs.map(job => ({
      id: job.id,
      processingStage: job.processingStage as ProcessingStageType | undefined,
      stageStartedAt: job.stageStartedAt || undefined,
    }));
  } catch (error) {
    logger.error("Failed to find stale jobs", { error });
    return [];
  }
}

/**
 * 检查阶段是否超时
 * @param stage 处理阶段
 * @param stageStartedAt 阶段开始时间
 * @returns 是否超时
 */
export function isStageTimeout(
  stage: ProcessingStageType,
  stageStartedAt: Date
): boolean {
  const timeout = STAGE_TIMEOUTS[stage];
  if (timeout === 0) return false;

  const elapsed = Date.now() - stageStartedAt.getTime();
  return elapsed > timeout;
}

/**
 * 标记任务失败
 * @param db 数据库实例
 * @param generationId 生成任务ID
 * @param errorMessage 错误信息
 */
export async function markJobFailed(
  db: ReturnType<typeof createDb>,
  generationId: string,
  errorMessage: string
): Promise<void> {
  try {
    await db
      .update(schema.generations)
      .set({
        status: "failed",
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(schema.generations.id, generationId));

    logger.info("Marked job as failed", { generationId, errorMessage });
  } catch (error) {
    logger.error("Failed to mark job as failed", { generationId, error });
    throw error;
  }
}

/**
 * 重新入队任务(重置为待处理状态)
 * @param db 数据库实例
 * @param generationId 生成任务ID
 */
export async function requeueJob(
  db: ReturnType<typeof createDb>,
  generationId: string
): Promise<void> {
  try {
    await db
      .update(schema.generations)
      .set({
        status: "pending",
        processingStage: null,
        stageStartedAt: null,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.generations.id, generationId));

    logger.info("Requeued job", { generationId });
  } catch (error) {
    logger.error("Failed to requeue job", { generationId, error });
    throw error;
  }
}

/**
 * 任务队列统计
 * @param db 数据库实例
 * @returns 队列统计信息
 */
export async function getQueueStats(
  db: ReturnType<typeof createDb>
): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  stale: number;
}> {
  try {
    const stats = await db
      .select({
        status: schema.generations.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(schema.generations)
      .groupBy(schema.generations.status);

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      stale: 0,
    };

    for (const row of stats) {
      if (row.status in result) {
        result[row.status as keyof typeof result] = row.count;
      }
    }

    // 计算超时任务数
    const staleJobs = await findStaleJobs(db, 5);
    result.stale = staleJobs.length;

    return result;
  } catch (error) {
    logger.error("Failed to get queue stats", { error });
    return { pending: 0, processing: 0, completed: 0, failed: 0, stale: 0 };
  }
}
