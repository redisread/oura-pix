import {
  GenerationSettings,
  GenerationResult,
  GenerationStatus,
} from "@/db/schema";
import { getCloudflareContext } from "@/lib/cloudflare-context";
import { arrayBufferToBase64 } from "@/lib/utils/base64";
import type {
  ImageAnalysisResult,
  GenerateRequest,
} from "@/types/ai";

interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

async function getGeminiConfig(): Promise<GeminiConfig> {
  const { env } = await getCloudflareContext();
  return {
    apiKey: env.GEMINI_API_KEY,
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.5-flash",
  };
}

export type { ImageAnalysisResult, GenerateRequest };

/**
 * 分析图片内容
 * @param imageUrl 图片 URL
 * @returns 分析结果
 */
export async function analyzeImage(
  imageUrl: string
): Promise<ImageAnalysisResult> {
  const config = await getGeminiConfig();

  // 获取图片内容并转为 base64
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
  }
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = arrayBufferToBase64(imageBuffer);
  const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Analyze this product image and provide detailed information in the following JSON format (respond with JSON only, no markdown):
{
  "category": "product category",
  "features": ["feature1", "feature2"],
  "colors": ["color1", "color2"],
  "materials": ["material1", "material2"],
  "detectedText": ["text1", "text2"],
  "description": "detailed description",
  "confidence": 0.95
}`,
          },
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(
    `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image analysis failed: ${error}`);
  }

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error("Empty response from image analysis");
  }

  return JSON.parse(content) as ImageAnalysisResult;
}

/**
 * 批量生成商品详情
 * @param request 生成请求
 * @returns 生成结果列表
 */
export async function generateProductDetails(
  request: GenerateRequest
): Promise<GenerationResult[]> {
  const config = await getGeminiConfig();
  const { productImageUrl, referenceImageUrls = [], prompt, settings } = request;

  // 分析产品图片
  const analysis = await analyzeImage(productImageUrl);

  // 分析参考图片(如果有)
  const referenceAnalyses: ImageAnalysisResult[] = [];
  for (const refUrl of referenceImageUrls) {
    try {
      const refAnalysis = await analyzeImage(refUrl);
      referenceAnalyses.push(refAnalysis);
    } catch (error) {
      console.warn(`Failed to analyze reference image: ${refUrl}`, error);
    }
  }

  // 构建生成提示词
  const generationPrompt = buildGenerationPrompt(
    analysis,
    referenceAnalyses,
    prompt,
    settings
  );

  // 将图片 URL 转换为 Gemini inlineData 格式
  async function urlToInlinePart(url: string) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
    const buf = await res.arrayBuffer();
    const mime = res.headers.get("content-type") || "image/jpeg";
    return {
      inlineData: {
        mimeType: mime,
        data: arrayBufferToBase64(buf),
      },
    };
  }

  // 准备消息内容（Gemini parts 格式）
  type GeminiPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } };

  const parts: GeminiPart[] = [{ text: generationPrompt }];

  // 主图片
  parts.push(await urlToInlinePart(productImageUrl));

  // 添加参考图片（最多 3 张）
  for (const refUrl of referenceImageUrls.slice(0, 3)) {
    try {
      parts.push(await urlToInlinePart(refUrl));
    } catch (err) {
      console.warn(`Skipping reference image: ${refUrl}`, err);
    }
  }

  // 生成数量
  const count = settings.count || 3;
  const results: GenerationResult[] = [];

  for (let i = 0; i < count; i++) {
    const requestBody = {
      contents: [
        {
          parts,
        },
      ],
      generationConfig: {
        responseMimeType: "application/json" as string,
        temperature: 0.7 + i * 0.1, // 略微变化以获得不同结果
      },
    };

    const response = await fetch(
      `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Generation failed: ${error}`);
    }

    const data = await response.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    };
    const generatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedContent) {
      throw new Error("Empty response from generation");
    }

    const parsedResult = JSON.parse(generatedContent);
    results.push({
      id: crypto.randomUUID(),
      title: parsedResult.title || "",
      description: parsedResult.description || "",
      tags: parsedResult.tags || [],
      imageUrl: parsedResult.imageUrl,
      confidenceScore: parsedResult.confidenceScore || 0.8,
      metadata: {
        variation: i + 1,
        temperature: requestBody.generationConfig.temperature,
        ...parsedResult.metadata,
      },
    });
  }

  return results;
}

/**
 * 构建生成提示词
 */
function buildGenerationPrompt(
  analysis: ImageAnalysisResult,
  referenceAnalyses: ImageAnalysisResult[],
  userPrompt: string | undefined,
  settings: GenerationSettings
): string {
  const platform = settings.targetPlatform || "generic";
  const language = settings.language || "en";
  const style = settings.style || "professional";

  // 平台特定的要求
  const platformRequirements: Record<string, string> = {
    amazon: "Optimize for Amazon SEO with bullet points and search keywords.",
    ebay: "Create an engaging eBay listing with clear specifications.",
    shopify: "Write compelling Shopify product descriptions for conversions.",
    etsy: "Use creative, handmade-focused language suitable for Etsy.",
    generic: "Create versatile content suitable for any e-commerce platform.",
  };

  // 风格要求
  const styleRequirements: Record<string, string> = {
    professional: "Use professional, technical language with precise specifications.",
    lifestyle: "Focus on lifestyle benefits and emotional appeal.",
    minimal: "Keep descriptions concise and minimalist.",
    luxury: "Use sophisticated, premium language emphasizing quality.",
  };

  // 语言映射
  const languageMap: Record<string, string> = {
    en: "English",
    zh: "Chinese",
    ja: "Japanese",
    ko: "Korean",
    de: "German",
    fr: "French",
    es: "Spanish",
    it: "Italian",
  };

  const targetLanguage = languageMap[language] || language;

  // 参考图片分析摘要
  const referenceSummary =
    referenceAnalyses.length > 0
      ? `\n\nReference Images Analysis:\n${referenceAnalyses
          .map(
            (ref, idx) =>
              `Reference ${idx + 1}: ${ref.description}\nStyle: ${ref.features.join(", ")}`
          )
          .join("\n\n")}`
      : "";

  return `You are an expert e-commerce copywriter specializing in cross-border trade.
Create compelling product listings based on the provided image analysis.

Product Analysis:
- Category: ${analysis.category}
- Features: ${analysis.features.join(", ")}
- Colors: ${analysis.colors.join(", ")}
- Materials: ${analysis.materials.join(", ")}
- Description: ${analysis.description}
${referenceSummary}

${userPrompt ? `User Requirements: ${userPrompt}\n` : ""}
Platform: ${platform}
${platformRequirements[platform]}
Style: ${styleRequirements[style]}
Language: ${targetLanguage}

Generate a complete product listing in the following JSON format:
{
  "title": "Compelling product title (max 200 characters)",
  "description": "Detailed product description with HTML formatting",
  "tags": ["keyword1", "keyword2", "keyword3", ...],
  "confidenceScore": 0.95,
  "metadata": {
    "seoKeywords": ["keyword1", "keyword2"],
    "bulletPoints": ["point1", "point2", "point3"],
    "specifications": {"key": "value"}
  }
}`;
}

/**
 * 验证生成设置
 * @param settings 生成设置
 * @returns 验证后的设置
 */
export function validateGenerationSettings(
  settings: Partial<GenerationSettings>
): GenerationSettings {
  const validPlatforms = ["amazon", "ebay", "shopify", "etsy", "generic"];
  const validStyles = ["professional", "lifestyle", "minimal", "luxury"];
  const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];

  return {
    targetPlatform: validPlatforms.includes(settings.targetPlatform || "")
      ? settings.targetPlatform
      : "generic",
    language: settings.language || "en",
    count: Math.min(Math.max(settings.count || 3, 1), 10),
    style: validStyles.includes(settings.style || "")
      ? settings.style
      : "professional",
    generateImages: settings.generateImages ?? true,
    imageCount: Math.min(Math.max(settings.imageCount || 5, 3), 10),
    aspectRatio: validAspectRatios.includes(settings.aspectRatio || "")
      ? settings.aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
      : "1:1",
    allowPersons: settings.allowPersons ?? false,
    extra: settings.extra || {},
  };
}

/**
 * 估算生成成本(用于配额检查)
 * @param imageCount 图片数量
 * @param generationCount 生成数量
 * @param includeImageGen 是否包含图像生成
 * @param imageGenCount 图像生成数量
 * @returns 估算的信用点消耗
 */
export function estimateGenerationCost(
  imageCount: number,
  generationCount: number,
  includeImageGen: boolean = false,
  imageGenCount: number = 0
): number {
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
