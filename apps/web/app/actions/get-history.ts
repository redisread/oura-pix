"use server";

/**
 * Get generations list API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export type TimeFilter = "all" | "today" | "week" | "month";

export interface GetHistoryParams {
  page?: number;
  pageSize?: number;
  filter?: TimeFilter;
}

export interface GetHistoryResponse {
  success: boolean;
  data?: Array<{
    id: string;
    prompt: string | null;
    platform: string;
    style: string;
    language: string;
    count: number;
    productImageId: string | null;
    productImageUrl: string | null;
    referenceImageUrls: string[];
    generatedImages: string[];
    createdAt: Date;
    status: string;
    errorMessage?: string | null;
  }>;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error?: string;
}

export interface UserStats {
  totalGenerations: number;
  thisMonth: number;
  remainingCredits: number;
  favoriteStyle: string;
}

async function getSessionCookie(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get("ourapix.session")?.value || null;
}

/**
 * Get generation history list
 */
export async function getHistory(
  params: GetHistoryParams
): Promise<GetHistoryResponse> {
  try {
    const sessionCookie = await getSessionCookie();

    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set("page", params.page.toString());
    if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
    if (params.filter) searchParams.set("filter", params.filter);

    const response = await fetch(
      `${API_URL}/api/generations?${searchParams.toString()}`,
      {
        headers: {
          ...(sessionCookie ? { Cookie: `ourapix.session=${sessionCookie}` } : {}),
        },
      }
    );

    const data = await response.json() as {
      success: boolean;
      data?: GetHistoryResponse["data"];
      pagination?: GetHistoryResponse["pagination"];
      error?: string;
    };

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to get history",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get history",
    };
  }
}

/**
 * Get user stats
 */
export async function getUserStats(): Promise<{
  success: boolean;
  data?: { stats: UserStats };
  error?: string;
}> {
  try {
    const sessionCookie = await getSessionCookie();

    const response = await fetch(
      `${API_URL}/api/generations?stats=true`,
      {
        headers: {
          ...(sessionCookie ? { Cookie: `ourapix.session=${sessionCookie}` } : {}),
        },
      }
    );

    const data = await response.json() as {
      success: boolean;
      data?: { stats: UserStats };
      error?: string;
    };

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to get stats",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get stats",
    };
  }
}
