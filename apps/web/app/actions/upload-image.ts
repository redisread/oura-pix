"use server";

/**
 * Upload image API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export interface UploadImageResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    originalName: string;
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
  };
  error?: string;
}

async function getSessionCookie(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get("ourapix.session")?.value || null;
}

/**
 * Upload image to R2
 */
export async function uploadImage(
  formData: FormData
): Promise<UploadImageResponse> {
  try {
    const sessionCookie = await getSessionCookie();

    const response = await fetch(`${API_URL}/api/upload/direct`, {
      method: "POST",
      headers: {
        ...(sessionCookie ? { Cookie: `ourapix.session=${sessionCookie}` } : {}),
      },
      body: formData,
    });

    const data = await response.json() as {
      success: boolean;
      data?: UploadImageResponse["data"];
      error?: string;
    };

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to upload image",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload image",
    };
  }
}
