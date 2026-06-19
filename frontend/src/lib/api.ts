/**
 * API Client for OuraPix Frontend
 *
 * Uses @oura-pix/api-client with Astro-specific configuration
 */

import { createClient, ENDPOINTS } from "@oura-pix/api-client";
import type {
  SignInInput,
  SignUpInput,
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
      ...init?.headers,
    },
  });
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, init);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = json?.error?.message ?? json?.error ?? `Request failed: ${response.status}`;
    throw new Error(message);
  }
  if (!json.success) {
    const message = json?.error?.message ?? json?.error ?? "Request failed";
    throw new Error(message);
  }
  return json.data as T;
}

// ============================================
// Auth APIs
// ============================================

export async function signIn(input: SignInInput) {
  const response = await api.post(ENDPOINTS.auth.signIn, input);
  return response.data;
}

export async function signUp(input: SignUpInput) {
  const response = await api.post(ENDPOINTS.auth.signUp, input);
  return response.data;
}

export async function signOut() {
  const response = await api.post(ENDPOINTS.auth.signOut);
  return response.data;
}

export async function getSession() {
  const response = await api.get(ENDPOINTS.auth.session);
  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post(ENDPOINTS.auth.forgotPassword, { email });
  return response.data;
}

export async function resetPassword(token: string, password: string) {
  const response = await api.post(ENDPOINTS.auth.resetPassword, { token, password });
  return response.data;
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
