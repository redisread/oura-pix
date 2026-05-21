import { getSession, signIn, signUp, signOut } from "@/lib/auth";
import { useCallback, useState, useEffect } from "react";

/**
 * User type definition
 */
export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  createdAt?: Date | string | null;
}

/**
 * Auth operation result
 */
interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Auth Hook
 * Provides user state and auth operation methods
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
   * User login
   * @param email Email address
   * @param password Password
   * @returns Login result
   */
  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const result = await signIn(email, password);
    if (result.success) {
      await loadSession();
    }
    return result;
  }, []);

  /**
   * User register
   * @param name User name
   * @param email Email address
   * @param password Password
   * @returns Register result
   */
  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    const result = await signUp(email, password, name);
    if (result.success) {
      await loadSession();
    }
    return result;
  }, []);

  /**
   * User logout
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
