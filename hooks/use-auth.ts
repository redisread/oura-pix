"use client";

import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";
import { useCallback } from "react";

/**
 * 用户信息类型
 */
export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * 认证操作结果类型
 */
interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * 认证 Hook
 * 提供用户状态和认证操作方法
 */
export function useAuth() {
  const { data: session, isPending, error, refetch } = useSession();

  /**
   * 用户登录
   * @param email 邮箱地址
   * @param password 密码
   * @returns 登录结果
   */
  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      await refetch();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "登录失败",
      };
    }
  }, [refetch]);

  /**
   * 用户注册
   * @param name 用户名
   * @param email 邮箱地址
   * @param password 密码
   * @returns 注册结果
   */
  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      await refetch();
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "注册失败",
      };
    }
  }, [refetch]);

  /**
   * 用户登出
   */
  const logout = useCallback(async (): Promise<void> => {
    await signOut();
    await refetch();
  }, [refetch]);

  return {
    user: session?.user as User | null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error: error?.message,
    login,
    register,
    logout,
    refetch,
  };
}
