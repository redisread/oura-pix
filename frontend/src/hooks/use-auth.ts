import { getSession, signIn, signUp, signOut } from "@/lib/auth";
import { useCallback, useEffect } from "react";
import { useAuthStore, type User } from "@/stores/auth";

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
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout: storeLogout } = useAuthStore();

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getSession();
      if (session?.user) {
        setUser(session.user as User);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

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
  }, [loadSession]);

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
  }, [loadSession]);

  /**
   * User logout
   */
  const logout = useCallback(async (): Promise<void> => {
    await signOut();
    storeLogout();
  }, [storeLogout]);

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
