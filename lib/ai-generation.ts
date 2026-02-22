import {
  GenerationSettings,
  GenerationResult,
  GenerationStatus,
} from "@/db/schema";

/**
 * Gemini Banana API 配置
 */
interface GeminiBananaConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

/**
 * 获取 Gemini Banana API 配置
 */
function getGeminiConfig(): GeminiBananaConfig {
  return {
    apiKey: process.env.GEMINI_BANANA_API_KEY || "",
    baseUrl: process.env.GEMINI_BANANA_BASE_URL || "https://api.geminibanana.com/v1",
    model: process.env.GEMINI_BANANA_MODEL || "gemini-pro-vision",
  };
}

/**
 * 图片分析结果
 */
export interface ImageAnalysisResult {
  // 检测到的产品类别
  category: string;
  // 产品特征描述
  features: string[];
  // 颜色信息
  colors: string[];
  // 材质信息
  materials: string[];
  // 检测到的文字
  detectedText: string[];
  // 整体描述
  description: string;
  // 置信度
  confidence: number;
}

/**
 * 生成请求参数
 */
export interface GenerateRequest {
  // 产品图片 URL
  productImageUrl: string;
  // 参考图片 URL 列表
  referenceImageUrls?: string[];
  // 用户提示词
  prompt?: string;
  // 生成设置
  settings: GenerationSettings;
}

/**
 * 分析图片内容
 * @param imageUrl 图片 URL
 * @returns 分析结果
 */
export async function analyzeImage(
  imageUrl: string
): Promise<ImageAnalysisResult> {
  const config = getGeminiConfig();

  const requestBody = {
    model: config.model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this product image and provide detailed information in the following JSON format:
{
  "category": "product category",
  "features": ["feature1", "feature2", ...],
  "colors": ["color1", "color2", ...],
  "materials": ["material1", "material2", ...],
  "detectedText": ["text1", "text2", ...],
  "description": "detailed description",
  "confidence": 0.95
}`,
          },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    response_format: { type: "json_object" },
  };

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Image analysis failed: ${error}`);
  }

  const data = await response.json() as { choices: { message: { content: string } }[] };
  const content = data.choices[0]?.message?.content;

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
  const config = getGeminiConfig();
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

  // 准备消息内容
  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: "text", text: generationPrompt },
    { type: "image_url", image_url: { url: productImageUrl } },
  ];

  // 添加参考图片
  for (const refUrl of referenceImageUrls.slice(0, 3)) {
    content.push({ type: "image_url", image_url: { url: refUrl } });
  }

  // 生成数量
  const count = settings.count || 3;
  const results: GenerationResult[] = [];

  for (let i = 0; i < count; i++) {
    const requestBody = {
      model: config.model,
      messages: [
        {
          role: "user",
          content,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7 + i * 0.1, // 略微变化以获得不同结果
    };

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Generation failed: ${error}`);
    }

    const data = await response.json() as { choices: { message: { content: string } }[] };
    const generatedContent = data.choices[0]?.message?.content;

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
        temperature: requestBody.temperature,
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

  return {
    targetPlatform: validPlatforms.includes(settings.targetPlatform || "")
      ? settings.targetPlatform
      : "generic",
    language: settings.language || "en",
    count: Math.min(Math.max(settings.count || 3, 1), 10),
    style: validStyles.includes(settings.style || "")
      ? settings.style
      : "professional",
    extra: settings.extra || {},
  };
}

/**
 * 估算生成成本(用于配额检查)
 * @param imageCount 图片数量
 * @param generationCount 生成数量
 * @returns 估算的信用点消耗
 */
export function estimateGenerationCost(
  imageCount: number,
  generationCount: number
): number {
  // 基础成本 + 图片分析成本 + 生成成本
  const baseCost = 1;
  const imageAnalysisCost = imageCount * 2;
  const generationCost = generationCount * 3;
  return baseCost + imageAnalysisCost + generationCost;
}
