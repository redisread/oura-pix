/**
 * AI 相关类型定义
 * 统一存放在此文件避免重复定义
 */

/**
 * 图片分析结果
 */
export interface ImageAnalysisResult {
  /** 检测到的产品类别 */
  category: string;
  /** 产品特征描述 */
  features: string[];
  /** 颜色信息 */
  colors: string[];
  /** 材质信息 */
  materials: string[];
  /** 检测到的文字 */
  detectedText: string[];
  /** 整体描述 */
  description: string;
  /** 置信度 */
  confidence: number;
}

/**
 * 生成设置
 */
export interface GenerationSettings {
  /** 目标平台 */
  targetPlatform?: "amazon" | "ebay" | "shopify" | "etsy" | "generic";
  /** 目标语言 */
  language?: string;
  /** 生成数量 */
  count?: number;
  /** 风格偏好 */
  style?: "professional" | "lifestyle" | "minimal" | "luxury";
  /** 是否生成场景图 */
  generateImages?: boolean;
  /** 场景图生成数量 */
  imageCount?: number;
  /** 图片宽高比 */
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  /** 是否允许生成人物 */
  allowPersons?: boolean;
  /** 额外配置 */
  extra?: Record<string, unknown>;
}

/**
 * 生成结果
 */
export interface GenerationResult {
  /** 结果ID */
  id: string;
  /** 生成的标题 */
  title: string;
  /** 生成的描述 */
  description: string;
  /** 生成的标签/关键词 */
  tags: string[];
  /** 生成的图片URL(如果有) */
  imageUrl?: string;
  /** 置信度分数 */
  confidenceScore?: number;
  /** 生成的场景图列表 */
  sceneImages?: Array<{
    imageId: string;
    url: string;
    aspectRatio: string;
    width: number;
    height: number;
    promptUsed: string;
    variation: number;
  }>;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 生成请求参数
 */
export interface GenerateRequest {
  /** 产品图片 URL */
  productImageUrl: string;
  /** 参考图片 URL 列表 */
  referenceImageUrls?: string[];
  /** 用户提示词 */
  prompt?: string;
  /** 生成设置 */
  settings: GenerationSettings;
}

/**
 * 图像生成选项
 */
export interface ImageGenerationOptions {
  /** 宽高比 */
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  /** 是否允许生成人物 */
  allowPersons?: boolean;
  /** 生成数量 */
  numberOfImages?: number;
  /** 安全设置级别 */
  safetySettings?: 'default' | 'strict' | 'permissive';
}

/**
 * 图像生成结果
 */
export interface ImageGenResult {
  /** Base64 编码的图片数据 */
  base64: string;
  /** MIME 类型 */
  mimeType: string;
  /** 使用的提示词 */
  promptUsed: string;
}

/**
 * 提示词配置
 */
export interface PromptConfig {
  /** 提示词文本 */
  text: string;
}
