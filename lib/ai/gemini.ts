/**
 * Gemini AI Service Integration
 * Handles AI content generation with retry logic and error handling
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

/**
 * Gemini API configuration
 */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || 'https://api.banana.dev';

/**
 * Validate environment variables
 */
function validateConfig(): void {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing GEMINI_API_KEY environment variable');
  }
}

/**
 * Gemini client instance
 */
let genAI: GoogleGenerativeAI | null = null;

/**
 * Get or create Gemini client
 */
function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    validateConfig();
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
  }
  return genAI;
}

/**
 * Model configurations
 */
export const GEMINI_MODELS = {
  FLASH: 'gemini-1.5-flash',
  PRO: 'gemini-1.5-pro',
  ULTRA: 'gemini-ultra',
} as const;

export type GeminiModel = typeof GEMINI_MODELS[keyof typeof GEMINI_MODELS];

/**
 * Generation options
 */
export interface GenerationOptions {
  model?: GeminiModel;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  timeout?: number;
  retries?: number;
}

/**
 * Default generation config
 */
const DEFAULT_CONFIG: GenerationConfig = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  topP: 0.9,
  topK: 40,
};

/**
 * Retry configuration
 */
const DEFAULT_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const MAX_RETRY_DELAY_MS = 10000;

/**
 * Generation result
 */
export interface GenerationResult<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  attempts: number;
}

/**
 * Product detail generation input
 */
export interface ProductDetailInput {
  productName: string;
  category?: string;
  targetAudience?: string;
  keyFeatures?: string[];
  brandVoice?: 'professional' | 'casual' | 'luxury' | 'fun' | 'technical';
  language: string;
  includeImages?: boolean;
}

/**
 * Generated product detail content
 */
export interface ProductDetailContent {
  title: string;
  description: string;
  bulletPoints: string[];
  seoKeywords: string[];
  metaDescription: string;
  suggestedImages?: string[];
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = Math.min(
    RETRY_DELAY_MS * Math.pow(2, attempt),
    MAX_RETRY_DELAY_MS
  );
  // Add jitter
  return delay + Math.random() * 1000;
}

/**
 * Generate content with retry logic
 * @param prompt - Input prompt
 * @param options - Generation options
 * @returns Generation result
 */
export async function generateContent(
  prompt: string,
  options: GenerationOptions = {}
): Promise<GenerationResult<string>> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const genAI = getGenAI();
      const modelName = options.model || GEMINI_MODELS.PRO;

      const model: GenerativeModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          ...DEFAULT_CONFIG,
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
          topP: options.topP,
          topK: options.topK,
        },
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Extract usage metadata if available
      const usage = response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined;

      return {
        success: true,
        data: text,
        usage,
        attempts: attempt + 1,
      };
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        return {
          success: false,
          error: `Client error: ${error.message}`,
          attempts: attempt + 1,
        };
      }

      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }

      // Wait before retrying
      await sleep(getRetryDelay(attempt));
    }
  }

  return {
    success: false,
    error: `Failed after ${retries + 1} attempts: ${lastError?.message}`,
    attempts: retries + 1,
  };
}

/**
 * Generate content from image
 * @param imageBuffer - Image data
 * @param mimeType - Image MIME type
 * @param prompt - Additional prompt
 * @param options - Generation options
 * @returns Generation result
 */
export async function generateFromImage(
  imageBuffer: Buffer,
  mimeType: string,
  prompt: string,
  options: GenerationOptions = {}
): Promise<GenerationResult<string>> {
  const retries = options.retries ?? DEFAULT_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const genAI = getGenAI();
      const modelName = options.model || GEMINI_MODELS.PRO;

      const model: GenerativeModel = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          ...DEFAULT_CONFIG,
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
          topP: options.topP,
          topK: options.topK,
        },
      });

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = result.response;
      const text = response.text();

      const usage = response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined;

      return {
        success: true,
        data: text,
        usage,
        attempts: attempt + 1,
      };
    } catch (error: any) {
      lastError = error;

      if (error.status && error.status >= 400 && error.status < 500) {
        return {
          success: false,
          error: `Client error: ${error.message}`,
          attempts: attempt + 1,
        };
      }

      if (attempt === retries) {
        break;
      }

      await sleep(getRetryDelay(attempt));
    }
  }

  return {
    success: false,
    error: `Failed after ${retries + 1} attempts: ${lastError?.message}`,
    attempts: retries + 1,
  };
}

/**
 * Generate product detail page content
 * @param input - Product input data
 * @param options - Generation options
 * @returns Generated content
 */
export async function generateProductDetail(
  input: ProductDetailInput,
  options: GenerationOptions = {}
): Promise<GenerationResult<ProductDetailContent>> {
  const brandVoiceMap: Record<string, string> = {
    professional: 'professional and trustworthy',
    casual: 'friendly and approachable',
    luxury: 'sophisticated and exclusive',
    fun: 'playful and energetic',
    technical: 'detailed and precise',
  };

  const voice = input.brandVoice
    ? brandVoiceMap[input.brandVoice]
    : 'professional and engaging';

  const prompt = `Generate a compelling product detail page for the following product:

Product Name: ${input.productName}
${input.category ? `Category: ${input.category}` : ''}
${input.targetAudience ? `Target Audience: ${input.targetAudience}` : ''}
${input.keyFeatures ? `Key Features: ${input.keyFeatures.join(', ')}` : ''}
Language: ${input.language}
Brand Voice: ${voice}

Please generate the following in JSON format:
1. title: An engaging product title (max 100 characters)
2. description: A compelling product description (200-300 words)
3. bulletPoints: 5 key selling points as bullet points
4. seoKeywords: 10 relevant SEO keywords
5. metaDescription: Meta description for SEO (max 160 characters)

Return ONLY valid JSON without markdown formatting.`;

  const result = await generateContent(prompt, {
    ...options,
    temperature: 0.8,
  });

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error,
      attempts: result.attempts,
    };
  }

  try {
    // Clean up the response to handle potential markdown
    let jsonStr = result.data.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/```$/, '');
    }

    const content: ProductDetailContent = JSON.parse(jsonStr);

    return {
      success: true,
      data: content,
      usage: result.usage,
      attempts: result.attempts,
    };
  } catch (parseError: any) {
    return {
      success: false,
      error: `Failed to parse AI response: ${parseError.message}`,
      attempts: result.attempts,
    };
  }
}

/**
 * Generate content from product image
 * @param imageBuffer - Product image
 * @param mimeType - Image MIME type
 * @param language - Output language
 * @param options - Generation options
 * @returns Generated content
 */
export async function generateFromProductImage(
  imageBuffer: Buffer,
  mimeType: string,
  language: string,
  options: GenerationOptions = {}
): Promise<GenerationResult<ProductDetailContent>> {
  const prompt = `Analyze this product image and generate a complete product detail page in ${language}.

Please provide the following in JSON format:
1. title: An engaging product title based on what you see (max 100 characters)
2. description: A compelling product description (200-300 words)
3. bulletPoints: 5 key selling points highlighting visible features
4. seoKeywords: 10 relevant SEO keywords
5. metaDescription: Meta description for SEO (max 160 characters)

Return ONLY valid JSON without markdown formatting.`;

  const result = await generateFromImage(imageBuffer, mimeType, prompt, {
    ...options,
    temperature: 0.8,
  });

  if (!result.success || !result.data) {
    return {
      success: false,
      error: result.error,
      attempts: result.attempts,
    };
  }

  try {
    let jsonStr = result.data.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/```$/, '');
    }

    const content: ProductDetailContent = JSON.parse(jsonStr);

    return {
      success: true,
      data: content,
      usage: result.usage,
      attempts: result.attempts,
    };
  } catch (parseError: any) {
    return {
      success: false,
      error: `Failed to parse AI response: ${parseError.message}`,
      attempts: result.attempts,
    };
  }
}

/**
 * Streaming generation for real-time content
 * @param prompt - Input prompt
 * @param onChunk - Callback for each chunk
 * @param options - Generation options
 */
export async function generateContentStream(
  prompt: string,
  onChunk: (chunk: string) => void,
  options: GenerationOptions = {}
): Promise<GenerationResult<void>> {
  try {
    const genAI = getGenAI();
    const modelName = options.model || GEMINI_MODELS.PRO;

    const model: GenerativeModel = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        ...DEFAULT_CONFIG,
        temperature: options.temperature,
        maxOutputTokens: options.maxOutputTokens,
        topP: options.topP,
        topK: options.topK,
      },
    });

    const result = await model.generateContentStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        onChunk(text);
      }
    }

    return {
      success: true,
      attempts: 1,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      attempts: 1,
    };
  }
}

/**
 * Batch generation for multiple products
 * @param inputs - Array of product inputs
 * @param options - Generation options
 * @param onProgress - Progress callback
 * @returns Array of results
 */
export async function batchGenerateProductDetails(
  inputs: ProductDetailInput[],
  options: GenerationOptions = {},
  onProgress?: (completed: number, total: number) => void
): Promise<GenerationResult<ProductDetailContent>[]> {
  const results: GenerationResult<ProductDetailContent>[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const result = await generateProductDetail(inputs[i], options);
    results.push(result);

    if (onProgress) {
      onProgress(i + 1, inputs.length);
    }

    // Small delay between requests to avoid rate limiting
    if (i < inputs.length - 1) {
      await sleep(500);
    }
  }

  return results;
}
