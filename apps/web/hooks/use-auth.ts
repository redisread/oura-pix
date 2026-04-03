"use client";

import { getSession, signIn, signUp, signOut } from "@/lib/auth";
import { useCallback, useState, useEffect } from "react";

/**
 * 用户信息类型
 */
export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  createdAt?: Date | string | null;
}

/**
 * 认证操作结果
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user as User);
        setIsAuthenticated(true);
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 用户登录
   * @param email 邮箱地址
   * @param password 密码
   * @returns 登录结果
   */
  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await signIn(email, password);
    if (result.success) {
      await loadSession();
    }
    return result;
  }, []);

  /**
   * 用户注册
   * @param name 用户名
   * @param email 邮箱地址
   * @param password 密码
   * @returns 注册结果
   */
  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    const result = await signUp(email, password, name);
    if (result.success) {
      await loadSession();
    }
    return result;
  }, []);

  /**
   * 用户登出
   */
  const logout = useCallback(async (): Promise<void> => {
    await signOut();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refresh: loadSession,
  };
}
