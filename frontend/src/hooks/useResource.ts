/**
 * useResource — Generic API fetch hook for GET endpoints
 *
 * Unifies the loading/error/data + auto-fetch pattern
 * repeated across ~10 feature hooks.
 */

import { useState, useEffect, useCallback } from "react";
import { apiJson } from "@/lib/api";

interface UseResourceReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
  refetch: () => Promise<void>;
}

export function useResource<T>(
  endpoint: string | null,
  errorMsg: string
): UseResourceReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(endpoint !== null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (endpoint === null) return;
    setLoading(true);
    setError(null);
    try {
      setData(await apiJson<T>(endpoint));
    } catch (err) {
      setError(err instanceof Error ? err.message : errorMsg);
    } finally {
      setLoading(false);
    }
  }, [endpoint, errorMsg]);

  useEffect(() => {
    if (endpoint !== null) void refetch();
  }, [refetch, endpoint]);

  return { data, loading, error, setError, refetch };
}
