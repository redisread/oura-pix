/**
 * Auth utilities for client-side
 */

"use client";

import { api } from "./api";

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface Session {
  user: User;
  session: {
    id: string;
    expiresAt: Date;
  };
}

/**
 * Get current session from API
 */
export async function getSession(): Promise<Session | null> {
  try {
    const response = await api.get("/api/auth/session");
    if (response.data) {
      return response.data as Session;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post("/api/auth/sign-in", { email, password });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; code?: string } } };
    return {
      success: false,
      error: err.response?.data?.message || "Sign in failed",
    };
  }
}

/**
 * Sign up with email and password
 */
export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post("/api/auth/sign-up", { email, password, name });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; code?: string } } };
    return {
      success: false,
      error: err.response?.data?.message || "Sign up failed",
    };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await api.post("/api/auth/sign-out");
}

/**
 * Request password reset
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post("/api/auth/forgot-password", { email });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; code?: string } } };
    return {
      success: false,
      error: err.response?.data?.message || "Password reset failed",
    };
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await api.post("/api/auth/reset-password", { token, password });
    return { success: true };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; code?: string } } };
    return {
      success: false,
      error: err.response?.data?.message || "Password reset failed",
    };
  }
}

/**
 * Social sign in (Google/GitHub)
 * Redirects to the auth provider
 */
export function signInSocial(
  provider: "google" | "github",
  callbackURL: string = "/"
): void {
  // Redirect to API auth endpoint
  window.location.href = `/api/auth/sign-in/${provider}?callbackURL=${encodeURIComponent(callbackURL)}`;
}
