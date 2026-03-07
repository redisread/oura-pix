/**
 * 配额计算工具
 * 统一计算生成任务的成本和退还额度
 */

import type { GenerationSettings } from "@/types/ai";

/**
 * 生成成本计算参数
 */
interface CostCalculationParams {
  /** 图片数量（主图 + 参考图） */
  imageCount: number;
  /** 生成数量（文案生成数量） */
  generationCount: number;
  /** 是否包含图像生成 */
  includeImageGen: boolean;
  /** 图像生成数量 */
  imageGenCount: number;
}

/**
 * 退还成本计算参数
 */
interface RefundCalculationParams {
  /** 生成设置 */
  settings: GenerationSettings;
  /** 参考图片ID列表 */
  referenceImageIds: string[];
}

/**
 * 计算生成任务成本
 * 与 estimateGenerationCost 在 lib/ai-generation.ts 中的逻辑保持一致
 *
 * @param params 成本计算参数
 * @returns 估算的信用点消耗
 */
export function calculateGenerationCost(params: CostCalculationParams): number {
  const { imageCount, generationCount, includeImageGen, imageGenCount } = params;

  // 基础成本 + 图片分析成本 + 文本生成成本
  const baseCost = 1;
  const imageAnalysisCost = imageCount * 2;
  const textGenerationCost = generationCount * 3;

  // 图像生成成本 (每张图片 10 个信用点)
  const imageGenCost = includeImageGen
    ? generationCount * imageGenCount * 10
    : 0;

  return baseCost + imageAnalysisCost + textGenerationCost + imageGenCost;
}

/**
 * 计算退还额度
 * 使用与 calculateGenerationCost 一致的计算逻辑
 *
 * @param params 退还计算参数
 * @returns 应退还的信用点数量
 */
export function calculateRefundCost(params: RefundCalculationParams): number {
  const { settings, referenceImageIds } = params;

  // 计算图片数量：1张主图 + 参考图数量
  const imageCount = 1 + (referenceImageIds?.length || 0);

  // 生成数量（默认为3）
  const generationCount = settings?.count || 3;

  // 是否包含图像生成
  const includeImageGen = settings?.generateImages ?? false;

  // 图像生成数量（默认为5）
  const imageGenCount = settings?.imageCount || 5;

  return calculateGenerationCost({
    imageCount,
    generationCount,
    includeImageGen,
    imageGenCount,
  });
}

/**
 * 验证配额是否充足
 *
 * @param remaining 剩余配额
 * @param required 所需配额
 * @returns 是否有足够配额
 */
export function hasEnoughQuota(remaining: number, required: number): boolean {
  return remaining >= required;
}

/**
 * 获取配额不足错误信息
 *
 * @param required 所需配额
 * @param remaining 剩余配额
 * @returns 错误信息
 */
export function getQuotaErrorMessage(
  required: number,
  remaining: number
): string {
  return `Insufficient quota. Required: ${required}, Remaining: ${remaining}`;
}
