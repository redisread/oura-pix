/**
 * Gemini Imagen 3 图像生成服务
 * 用于生成商品场景图
 */

import { getCloudflareContext } from '@/lib/cloudflare-context';
import type {
  ImageAnalysisResult,
  GenerationSettings,
  ImageGenerationOptions,
  ImageGenResult,
  PromptConfig,
} from '@/types/ai';

/**
 * Imagen 3 API 配置
 */
const IMAGEN_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const IMAGEN_MODEL = 'imagen-4.0-generate-001';

export type { ImageGenResult, PromptConfig, ImageGenerationOptions };

/**
 * 平台特定的摄影风格要求
 */
const PLATFORM_PHOTOGRAPHY_STYLES: Record<string, string> = {
  amazon: 'clean white background, centered product placement, Amazon listing style, studio lighting, professional softbox setup',
  shopify: 'modern interior lifestyle setting, natural window light, casual relatable scenario, shopping website quality',
  ebay: 'clean product photography, neutral background, clear product visibility, online marketplace style',
  etsy: 'artisanal handmade aesthetic, natural materials backdrop, warm ambient lighting, creative lifestyle context',
  generic: 'professional product photography, clean background, optimal lighting, e-commerce ready'
};

/**
 * 风格特定的视觉要求
 */
const STYLE_VISUAL_REQUIREMENTS: Record<string, string> = {
  professional: 'studio lighting, professional photography, clean composition, technical precision, high-end commercial quality',
  lifestyle: 'lifestyle setting, natural environment, real-world context, human-centric perspective, relatable scenarios',
  minimal: 'minimalist aesthetic, clean lines, simple background, negative space, understated elegance',
  luxury: 'premium materials, sophisticated ambiance, elegant composition, high-end luxury feel, exclusive atmosphere'
};

/**
 * 场景变体类型
 */
const SCENE_VARIATIONS = [
  { name: 'front_view', description: 'straight-on front view, centered composition' },
  { name: '45_degree', description: '45-degree angle view, dynamic perspective' },
  { name: 'detail_closeup', description: 'extreme close-up of key features, macro photography' },
  { name: 'flat_lay', description: 'overhead flat lay, top-down view' },
  { name: 'lifestyle_context', description: 'in-use lifestyle scenario, environmental context' },
  { name: 'side_profile', description: 'side profile view, dimensional perspective' },
  { name: 'group_arrangement', description: 'arranged with complementary items, styled composition' },
  { name: 'texture_detail', description: 'texture and material focus, surface detail' },
  { name: 'packaging_view', description: 'product with packaging, unboxing aesthetic' },
  { name: 'scale_reference', description: 'size reference context, scale indication' }
];


/**
 * 构建基础提示词
 * @param analysis 产品分析结果
 * @param settings 生成设置
 * @returns 基础提示词
 */
function buildBasePrompt(
  analysis: ImageAnalysisResult,
  settings: GenerationSettings
): string {
  const platform = settings.targetPlatform || 'generic';
  const style = settings.style || 'professional';

  // 产品核心描述
  const productDesc = [
    analysis.description,
    analysis.colors.length > 0 ? `colors: ${analysis.colors.join(', ')}` : '',
    analysis.materials.length > 0 ? `materials: ${analysis.materials.join(', ')}` : ''
  ].filter(Boolean).join(', ');

  // 平台摄影风格
  const platformStyle = PLATFORM_PHOTOGRAPHY_STYLES[platform];

  // 风格视觉要求
  const styleRequirements = STYLE_VISUAL_REQUIREMENTS[style];

  // 技术参数
  const technicalParams = '4K, high resolution, sharp focus, professional photography';

  return `${productDesc}, ${platformStyle}, ${styleRequirements}, ${technicalParams}`;
}

/**
 * 构建提示词变体
 * @param basePrompt 基础提示词
 * @param count 生成数量
 * @returns 提示词变体数组
 */
function buildVariationPrompts(
  basePrompt: string,
  count: number
): PromptConfig[] {
  const variations = SCENE_VARIATIONS.slice(0, Math.min(count, SCENE_VARIATIONS.length));

  return variations.map(variation => ({
    text: `${basePrompt}, ${variation.description}`,
  }));
}

/**
 * 调用 Imagen API 生成单张图片
 * @param prompt 提示词配置
 * @param options 生成选项
 * @param apiKey API 密钥
 * @param retries 重试次数
 * @returns 生成结果
 */
async function generateSingleImage(
  prompt: PromptConfig,
  options: ImageGenerationOptions,
  apiKey: string,
  retries: number = 3
): Promise<ImageGenResult> {
  const requestBody = {
    instances: [
      {
        prompt: prompt.text,
      }
    ],
    parameters: {
      sampleCount: 1,
      aspectRatio: options.aspectRatio || '1:1',
      personGeneration: options.allowPersons ? 'allow_adult' : 'dont_allow',
    }
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(
        `${IMAGEN_API_BASE}/models/${IMAGEN_MODEL}:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        // 处理 429 限流错误
        if (response.status === 429) {
          if (attempt < retries - 1) {
            const delay = 1000 * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }

        throw new Error(`Imagen API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as { predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }> };

      // 提取生成的图片数据
      const imageData = data.predictions?.[0]?.bytesBase64Encoded;
      const mimeType = data.predictions?.[0]?.mimeType || 'image/png';

      if (!imageData) {
        throw new Error('No image data in response');
      }

      return {
        base64: imageData,
        mimeType,
        promptUsed: prompt.text
      };

    } catch (error: any) {
      lastError = error;

      // 内容安全拦截 - 不重试,直接跳过
      if (error.message?.includes('safety') || error.message?.includes('blocked')) {
        console.warn('Content safety filter triggered, skipping variation:', prompt.text);
        throw error;
      }

      // 最后一次尝试失败
      if (attempt === retries - 1) {
        break;
      }

      // 指数退避
      const delay = 1000 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Image generation failed after retries');
}

/**
 * 批量生成场景图
 * @param params 生成参数
 * @returns 生成结果数组
 */
export async function generateSceneImages(params: {
  productAnalysis: ImageAnalysisResult;
  settings: GenerationSettings;
  count: number;
  userPrompt?: string;
  options?: ImageGenerationOptions;
}): Promise<ImageGenResult[]> {
  const { productAnalysis, settings, count, userPrompt, options = {} } = params;

  // 获取 API 密钥
  const { env } = await getCloudflareContext();
  if (!env.GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }

  // 构建基础提示词
  let basePrompt = buildBasePrompt(productAnalysis, settings);

  // 如果用户提供了额外提示词,追加到基础提示词
  if (userPrompt) {
    basePrompt = `${basePrompt}, ${userPrompt}`;
  }

  // 构建提示词变体
  const promptVariations = buildVariationPrompts(basePrompt, count);

  // 并行生成图片
  const results: ImageGenResult[] = [];
  const errors: Error[] = [];

  for (const promptConfig of promptVariations) {
    try {
      const result = await generateSingleImage(
        promptConfig,
        options,
        env.GEMINI_API_KEY
      );
      results.push(result);
    } catch (error: any) {
      console.error('Failed to generate image variation:', error);
      errors.push(error);
      // 继续生成其他变体,不中断整个流程
    }
  }

  // 如果所有生成都失败,抛出错误
  if (results.length === 0) {
    throw new Error(
      `All image generation attempts failed. Errors: ${errors.map(e => e.message).join('; ')}`
    );
  }

  // 如果部分失败,记录警告但返回成功的结果
  if (errors.length > 0) {
    console.warn(`${errors.length} out of ${promptVariations.length} image generations failed`);
  }

  return results;
}

/**
 * 测试 Imagen API 连接
 * @returns 测试结果
 */
export async function testImagenConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { env } = await getCloudflareContext();
    if (!env.GEMINI_API_KEY) {
      return {
        success: false,
        error: 'Missing GEMINI_API_KEY'
      };
    }

    // 简单的测试提示词
    const testPrompt: PromptConfig = {
      text: 'a simple white cube on a white background, studio lighting, 4K',
    };

    await generateSingleImage(
      testPrompt,
      { aspectRatio: '1:1', numberOfImages: 1 },
      env.GEMINI_API_KEY,
      1 // 只尝试一次
    );

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}
