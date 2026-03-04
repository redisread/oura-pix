"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth 客户端配置
 * 用于客户端组件中的认证操作
 */
export const authClient = createAuthClient({});

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
