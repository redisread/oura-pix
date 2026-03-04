"use client";

import { createAuthClient } from "better-auth/react";

/**
 * 获取客户端 baseURL
 *
 * 在浏览器环境,从 window.location 动态获取
 * 在 SSR 环境,使用环境变量
 */
function getBaseURL(): string {
  // 浏览器环境 - 使用当前页面的 origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // SSR 环境 - 使用环境变量
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4001";
}

/**
 * Better Auth 客户端配置
 */
export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

/**
 * 导出认证方法
 */
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;
