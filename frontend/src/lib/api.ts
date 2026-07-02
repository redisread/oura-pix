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

export async function getGenerations(params?: GenerationsListParams) {
  const response = await api.get(ENDPOINTS.generations.list, { params });
  return response.data;
}

export async function getGeneration(id: string) {
  const response = await api.get(ENDPOINTS.generations.get(id));
  return response.data;
}

export async function createGeneration(input: CreateGenerationInput) {
  const response = await api.post(ENDPOINTS.generations.create, input);
  return response.data;
}

export async function cancelGeneration(id: string) {
  const response = await api.post(ENDPOINTS.generations.cancel(id));
  return response.data;
}

export async function deleteGeneration(id: string) {
  const response = await api.delete(ENDPOINTS.generations.get(id));
  return response.data;
}

export async function updateGenerationImage(
  id: string,
  image: Blob,
  imageIndex = 0
): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("imageIndex", String(imageIndex));

  const response = await api.patch<{ imageUrl: string }>(
    `${ENDPOINTS.generations.get(id)}/image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
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

export async function previewGeneration(
  request: PreviewGenerationRequest
): Promise<PreviewGenerationResponse> {
  try {
    const response = await api.post<PreviewGenerationResponse>(
      ENDPOINTS.generations.preview,
      request
    );
    return response.data;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : m.common_requestFailed() };
  }
}

// ============================================
// Upload APIs
// ============================================

export async function uploadImage(file: File, type: "product" | "reference") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await api.post<UploadImageResponse>(
    ENDPOINTS.upload.upload,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function getSignedUrl(fileName: string, fileType: string, type: "product" | "reference") {
  const response = await api.post(ENDPOINTS.upload.getSignedUrl, {
    fileName,
    fileType,
    type,
  });
  return response.data;
}

// ============================================
// Subscription APIs
// ============================================

export async function getSubscription() {
  const response = await api.get(ENDPOINTS.subscription.get);
  return response.data;
}

export async function createCheckoutSession(plan: string, successUrl: string, cancelUrl: string) {
  const response = await api.post(ENDPOINTS.subscription.checkout, {
    plan,
    successUrl,
    cancelUrl,
  });
  return response.data;
}

export async function createPortalSession(returnUrl: string) {
  const response = await api.post(ENDPOINTS.subscription.portal, { returnUrl });
  return response.data;
}
