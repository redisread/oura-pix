"use server";

/**
 * Generations API Client (Server Actions)
 *
 * Calls the external API instead of direct database operations
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface GenerationSettings {
  targetPlatform?: "amazon" | "ebay" | "shopify" | "etsy" | "generic";
  language?: string;
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
 * Get current session cookie
 */
async function getSessionCookie(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get("ourapix.session")?.value || null;
}

/**
 * Create generation task
 */
export async function createGeneration(
  request: CreateGenerationRequest
): Promise<CreateGenerationResponse> {
  try {
    const sessionCookie = await getSessionCookie();

    const response = await fetch(`${API_URL}/api/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionCookie ? { Cookie: `ourapix.session=${sessionCookie}` } : {}),
      },
      body: JSON.stringify(request),
    });

    const data = await response.json() as {
      success: boolean;
      data?: { id: string; status: string };
      error?: string;
    };

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to create generation",
      };
    }

    if (!data.data) {
      return {
        success: false,
        error: "No data returned",
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
    const sessionCookie = await getSessionCookie();

    const response = await fetch(
      `${API_URL}/api/generations/${generationId}`,
      {
        headers: {
          ...(sessionCookie ? { Cookie: `ourapix.session=${sessionCookie}` } : {}),
        },
      }
    );

    const data = await response.json() as {
      success: boolean;
      data?: GetGenerationResponse["data"];
      error?: string;
    };

    if (!response.ok) {
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
    const sessionCookie = await getSessionCookie();

    const response = await fetch(
      `${API_URL}/api/generations/${generationId}`,
      {
        method: "DELETE",
        headers: {
          ...(sessionCookie ? { Cookie: `ourapix.session=${sessionCookie}` } : {}),
        },
      }
    );

    const data = await response.json() as { success: boolean; error?: { message: string } };

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || "Failed to cancel generation",
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
    const sessionCookie = await getSessionCookie();

    const response = await fetch(
      `${API_URL}/api/generations/${generationId}`,
      {
        method: "DELETE",
        headers: {
          ...(sessionCookie ? { Cookie: `ourapix.session=${sessionCookie}` } : {}),
        },
      }
    );

    const data = await response.json() as { success: boolean; error?: { message: string } };

    if (!response.ok) {
      return {
        success: false,
        error: data.error?.message || "Failed to delete generation",
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
