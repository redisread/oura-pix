/**
 * API Client for OuraPix Frontend
 *
 * Uses @oura-pix/api-client with Astro-specific configuration
 */

import { createClient, ENDPOINTS } from "@oura-pix/api-client";
import { LOCALE_HEADER, type Locale } from "@oura-pix/i18n";
import * as m from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";
import type {
  CreateGenerationInput,
  GenerationsListParams,
  UploadImageResponse,
} from "@oura-pix/api-client";
import type { Pagination } from "@/lib/types";
// Use Astro's import.meta.env for environment variables.
export const API_BASE_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8989";

export const api = createClient({
  baseURL: API_BASE_URL,
  credentials: "include",
});

function currentLocale(): Locale {
  try {
    return getLocale() as Locale;
  } catch {
    return "zh-CN";
  }
}

api.interceptors.request.use((config) => {
  config.headers.set(LOCALE_HEADER, currentLocale());
  return config;
});

export function apiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      [LOCALE_HEADER]: currentLocale(),
      ...init?.headers,
    },
  });
}


/** Extract error message from unknown throwable */
export function apiErr(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = json?.error;
    const message =
      typeof error === "string"
        ? error
        : error?.message ?? error?.code ?? m.common_requestFailed();
    throw new Error(message);
  }
  if (!json.success) {
    const error = json?.error;
    const message =
      typeof error === "string"
        ? error
        : error?.message ?? error?.code ?? m.common_requestFailed();
    throw new Error(message);
  }
  return json.data as T;
}

// ============================================
// Generation APIs
// ============================================

/** Generation list API response (matches API envelope shape) */
export interface GenerationsListResult {
  data: GenerationRecord[];
  pagination: Pagination;
}

export interface GenerationRecord {
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
  createdAt: string;
  status: string;
  errorMessage?: string | null;
}

/** Public generation detail (subset used by polling + UI) */
export interface GenerationStatus {
  id: string;
  status: string;
  imageGenerationStatus?: string;
  results?: Array<{
    id: string;
    title: string;
    description: string;
    tags: string[];
    imageUrl: string;
  } | null>;
}

export interface CreateGenerationResult {
  id: string;
  status: string;
  createdAt: string;
}

export async function getGenerationsList(
  params?: GenerationsListParams
): Promise<GenerationsListResult> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  if (params?.filter && params.filter !== "all") query.set("filter", params.filter);
  const qs = query.toString();
  return apiJson<GenerationsListResult>(`${ENDPOINTS.generations.list}${qs ? "?" + qs : ""}`);
}

export async function getGeneration(id: string): Promise<GenerationStatus> {
  const env = await apiJson<{ data: GenerationStatus }>(ENDPOINTS.generations.get(id));
  return env.data;
}

export async function createGeneration(
  input: CreateGenerationInput
): Promise<CreateGenerationResult> {
  const env = await apiJson<{ data: CreateGenerationResult }>(ENDPOINTS.generations.create, {
    method: "POST",
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
  });
  return env.data;
}

export async function cancelGeneration(id: string): Promise<void> {
  await apiJson(ENDPOINTS.generations.cancel(id), { method: "POST" });
}

export async function deleteGeneration(id: string): Promise<void> {
  await apiJson(ENDPOINTS.generations.get(id), { method: "DELETE" });
}

export async function updateGenerationImage(
  id: string,
  image: Blob,
  imageIndex = 0
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("imageIndex", String(imageIndex));

  const env = await apiJson<{ data: { imageUrl: string } }>(
    `${ENDPOINTS.generations.get(id)}/image`,
    {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return env.data;
}


// ============================================
// Preview Generation
// ============================================

export interface PreviewGenerationRequest {
  productImageId?: string;
  prompt?: string;
  settings: {
    targetPlatform: "amazon" | "ebay" | "shopify" | "etsy" | "generic";
    language: "zh" | "en" | "ja";
    uiLocale?: Locale;
    style: "professional" | "lifestyle" | "minimal" | "luxury";
  };
}

export interface PreviewGenerationResponse {
  success: boolean;
  data?: {
    preview: {
      title: string;
      description: string;
      keywords: string[];
    };
  };
  error?: string;
}

export interface PreviewData {
  preview: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export async function previewGeneration(
  request: PreviewGenerationRequest
): Promise<PreviewGenerationResponse> {
  try {
    const data = await apiJson<PreviewData>(ENDPOINTS.generations.preview, {
      method: "POST",
      body: JSON.stringify(request),
      headers: { "Content-Type": "application/json" },
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : m.common_requestFailed() };
  }
}

// ============================================
// Upload APIs
// ============================================

export async function uploadImage(file: File, type: "product" | "reference"): Promise<UploadImageResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  return apiJson<UploadImageResponse>(ENDPOINTS.upload.upload, {
    method: "POST",
    body: formData,
  });
}

// ============================================
// Subscription APIs
// ============================================

export interface SubscriptionInfo {
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing";
  currentPeriodEnd?: number | string | null;
  usedGenerations: number;
  generationLimit: number;
}

export async function getSubscription(): Promise<SubscriptionInfo> {
  return apiJson<SubscriptionInfo>(ENDPOINTS.subscription.get);
}

export async function createCheckoutSession(plan: string, successUrl: string, cancelUrl: string): Promise<{ url: string }> {
  return apiJson<{ url: string }>(ENDPOINTS.subscription.checkout, {
    method: "POST",
    body: JSON.stringify({ plan, successUrl, cancelUrl }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function createPortalSession(returnUrl: string): Promise<{ url: string }> {
  return apiJson<{ url: string }>(ENDPOINTS.subscription.portal, {
    method: "POST",
    body: JSON.stringify({ returnUrl }),
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================
// Favorites APIs
// ============================================

export interface Favorite {
  id: string;
  generationId: string;
  imageUrl: string;
  imageIndex: number | null;
  createdAt: string;
  generation: {
    id: string;
    status: string;
    settings: {
      targetPlatform?: string;
      style?: string;
      language?: string;
    };
    createdAt: string;
  } | null;
}

export interface FavoritesListResult {
  data: Favorite[];
  pagination: Pagination;
}

export interface FavoriteCheckResult {
  isFavorited: boolean;
  favoriteId: string | null;
}

export interface BatchDeleteResult {
  deleted: number;
}

export async function getFavorites(
  page = 1,
  pageSize = 24
): Promise<FavoritesListResult> {
  const qs = `?page=${page}&pageSize=${pageSize}`;
  const env = await apiJson<{ data: Favorite[]; pagination: Pagination }>(
    `${ENDPOINTS.favorites.list}${qs}`
  );
  return { data: env.data, pagination: env.pagination };
}

export async function addFavorite(
  generationId: string,
  imageUrl: string,
  imageIndex?: number
): Promise<Favorite> {
  const env = await apiJson<{ data: Favorite }>(ENDPOINTS.favorites.add, {
    method: "POST",
    body: JSON.stringify({ generationId, imageUrl, ...(imageIndex !== undefined ? { imageIndex } : {}) }),
    headers: { "Content-Type": "application/json" },
  });
  return env.data;
}

export async function removeFavorite(id: string): Promise<void> {
  await apiJson(ENDPOINTS.favorites.remove(id), { method: "DELETE" });
}

export async function batchRemoveFavorites(ids: string[]): Promise<number> {
  const env = await apiJson<{ data: BatchDeleteResult }>(ENDPOINTS.favorites.batchDelete, {
    method: "POST",
    body: JSON.stringify({ ids }),
    headers: { "Content-Type": "application/json" },
  });
  return env.data.deleted;
}

export async function checkFavorite(imageUrl: string): Promise<FavoriteCheckResult> {
  const env = await apiJson<{ data: FavoriteCheckResult }>(ENDPOINTS.favorites.check(imageUrl));
  return env.data;
}
