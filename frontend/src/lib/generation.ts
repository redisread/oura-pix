/**
 * Generation Actions
 * Client-side API calls for generation functionality
 */

import { api } from "./api";
import type { GenerationLanguage, Locale } from "@oura-pix/i18n";

interface GenerationSettings {
  targetPlatform?: "amazon" | "ebay" | "shopify" | "etsy" | "generic";
  language?: GenerationLanguage;
  uiLocale?: Locale;
  count?: number;
  style?: "professional" | "lifestyle" | "minimal" | "luxury";
  generateImages?: boolean;
  imageCount?: number;
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  allowPersons?: boolean;
}

export interface CreateGenerationRequest {
  productImageId: string;
  referenceImageIds?: string[];
  teamId?: string;
  prompt?: string;
  settings?: Partial<GenerationSettings>;
}

export interface CreateGenerationResponse {
  success: boolean;
  data?: {
    id: string;
    status: string;
    estimatedTime: number;
  };
  error?: string;
}

export interface GetGenerationResponse {
  success: boolean;
  data?: {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    imageGenerationStatus?: "pending" | "processing" | "completed" | "failed" | "skipped";
    generatedImageCount?: number;
    productImage: {
      id: string;
      url: string;
      originalName: string;
    };
    referenceImages?: Array<{
      id: string;
      url: string;
      originalName: string;
    }>;
    prompt?: string;
    settings: GenerationSettings;
    results?: Array<{
      id: string;
      title: string;
      description: string;
      tags: string[];
      imageUrl?: string;
      sceneImages?: Array<{
        imageId: string;
        url: string;
        aspectRatio: string;
        width: number;
        height: number;
        promptUsed: string;
        variation: number;
      }>;
    }>;
    errorMessage?: string;
    imageGenerationError?: string;
    progress?: number;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
  };
  error?: string;
}

/**
 * Create generation task
 */
export async function createGeneration(
  request: CreateGenerationRequest
): Promise<CreateGenerationResponse> {
  try {
    const response = await api.post("/api/generations", request);
    const data = response.data;

    if (!data.success || !data.data) {
      return {
        success: false,
        error: data.error || "Failed to create generation",
      };
    }

    return {
      success: true,
      data: {
        id: data.data.id,
        status: data.data.status,
        estimatedTime: 30,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create generation",
    };
  }
}

/**
 * Get generation details
 */
export async function getGeneration(
  generationId: string
): Promise<GetGenerationResponse> {
  try {
    const response = await api.get(`/api/generations/${generationId}`);
    const data = response.data;

    if (!data.success) {
      return {
        success: false,
        error: data.error || "Failed to get generation",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get generation",
    };
  }
}

/**
 * Cancel generation task
 */
export async function cancelGeneration(
  generationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await api.post(`/api/generations/${generationId}/cancel`);
    const data = response.data;

    if (!data.success) {
      return {
        success: false,
        error: data.error || "Failed to cancel generation",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel generation",
    };
  }
}

/**
 * Delete generation task
 */
export async function deleteGeneration(
  generationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await api.delete(`/api/generations/${generationId}`);
    const data = response.data;

    if (!data.success) {
      return {
        success: false,
        error: data.error || "Failed to delete generation",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete generation",
    };
  }
}
