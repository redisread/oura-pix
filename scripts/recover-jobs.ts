/**
 * 任务恢复脚本
 * 用于检测和恢复因 Worker 重启而中断的生成任务
 *
 * 使用方式:
 * 1. 手动执行: npx tsx scripts/recover-jobs.ts
 * 2. 定时任务: 配置 Cloudflare Cron Trigger 定期执行
 */

import { createDb, schema } from "../db";
import {
  findStaleJobs,
  requeueJob,
  markJobFailed,
  getQueueStats,
} from "../lib/task-queue";
import { logger } from "../lib/logger";
import { eq } from "drizzle-orm";

/**
 * 恢复任务配置
 */
interface RecoveryConfig {
  /** 超时时间(分钟),超过此时间的任务会被处理 */
  timeoutMinutes: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 是否自动重新入队(否则标记为失败) */
  autoRequeue: boolean;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: RecoveryConfig = {
  timeoutMinutes: 5,
  maxRetries: 3,
  autoRequeue: true,
};

/**
 * 获取任务重试次数
 * 通过查询使用日志来估算
 */
async function getJobRetryCount(
  db: ReturnType<typeof createDb>,
  generationId: string
): Promise<number> {
  try {
    const logs = await db.query.usageLogs.findMany({
      where: eq(schema.usageLogs.generationId, generationId),
    });
    return logs.length;
  } catch {
    return 0;
  }
}

/**
 * 执行恢复
 */
async function runRecovery(config: RecoveryConfig = DEFAULT_CONFIG): Promise<{
  recovered: number;
  failed: number;
  skipped: number;
  errors: string[];
}> {
  const result = {
    recovered: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // 注意:此脚本需要在 Cloudflare Workers 环境中运行
  // 本地测试时需要模拟 D1 数据库
  if (typeof process !== "undefined" && !process.env.CLOUDFLARE_ENV) {
    logger.warn("This script should run in Cloudflare Workers environment");
    logger.info("For local testing, use the recover endpoint in the app");
    return result;
  }

  try {
    // 这里需要传入 D1 数据库实例
    // 在 Workers 环境中通过 env.DB 获取
    throw new Error("This script must be run within Cloudflare Workers environment with D1 binding");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Recovery failed", { error: errorMessage });
    result.errors.push(errorMessage);
  }

  return result;
}

/**
 * 恢复任务(Worker 内部调用版本)
 * @param d1Database D1 数据库实例
 * @param config 恢复配置
 */
export async function recoverJobs(
  d1Database: typeof import("@cloudflare/workers-types").D1Database.prototype,
  config: Partial<RecoveryConfig> = {}
): Promise<{
  recovered: number;
  failed: number;
  skipped: number;
  errors: string[];
}> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const result = {
    recovered: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  const db = createDb(d1Database);

  try {
    // 打印队列统计
    const stats = await getQueueStats(db);
    logger.info("Current queue stats", stats);

    // 查找超时任务
    const staleJobs = await findStaleJobs(db, fullConfig.timeoutMinutes);

    if (staleJobs.length === 0) {
      logger.info("No stale jobs found");
      return result;
    }

    logger.info(`Found ${staleJobs.length} stale jobs`, {
      jobs: staleJobs.map((j) => ({ id: j.id, stage: j.processingStage })),
    });

    // 处理每个超时任务
    for (const job of staleJobs) {
      try {
        // 检查重试次数
        const retryCount = await getJobRetryCount(db, job.id);

        if (retryCount >= fullConfig.maxRetries) {
          // 超过最大重试次数,标记为失败
          await markJobFailed(
            db,
            job.id,
            `Task exceeded maximum retry attempts (${fullConfig.maxRetries})`
          );
          result.failed++;
          logger.warn("Marked job as failed due to max retries", {
            generationId: job.id,
            retryCount,
          });
        } else if (fullConfig.autoRequeue) {
          // 重新入队
          await requeueJob(db, job.id);
          result.recovered++;
          logger.info("Requeued stale job", {
            generationId: job.id,
            previousStage: job.processingStage,
            retryCount,
          });
        } else {
          // 跳过
          result.skipped++;
          logger.info("Skipped stale job", {
            generationId: job.id,
            previousStage: job.processingStage,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push(`Job ${job.id}: ${errorMessage}`);
        logger.error("Failed to process stale job", {
          generationId: job.id,
          error: errorMessage,
        });
      }
    }

    logger.info("Recovery completed", {
      recovered: result.recovered,
      failed: result.failed,
      skipped: result.skipped,
      errors: result.errors.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Recovery process failed", { error: errorMessage });
    result.errors.push(errorMessage);
  }

  return result;
}

/**
 * 主函数(用于 CLI 执行)
 */
async function main() {
  logger.info("Starting job recovery script...");
  logger.info("Note: This script should be run via Cloudflare Workers Cron Trigger");
  logger.info("For manual recovery, use the /api/admin/recover endpoint");

  const result = await runRecovery();

  console.log("\n=== Recovery Result ===");
  console.log(`Recovered: ${result.recovered}`);
  console.log(`Failed: ${result.failed}`);
  console.log(`Skipped: ${result.skipped}`);
  if (result.errors.length > 0) {
    console.log(`\nErrors:`);
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

export default recoverJobs;
