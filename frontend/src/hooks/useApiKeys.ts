/**
 * useApiKeys Hook
 */

import { useState, useEffect, useCallback } from "react";
import { apiJson } from "@/lib/api";
import * as m from "@/paraglide/messages.js";

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

interface CreatedKey extends ApiKey {
  key: string; // full key — only present in create response
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newlyCreated, setNewlyCreated] = useState<CreatedKey | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setKeys(await apiJson<ApiKey[]>("/api/keys"));
    } catch (err) {
      setError(err instanceof Error ? err.message : m.common_loadFailed());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = useCallback(
    async (name: string, expiresInDays?: number): Promise<CreatedKey | null> => {
      try {
        const created = await apiJson<CreatedKey>("/api/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, ...(expiresInDays ? { expiresInDays } : {}) }),
        });
        setNewlyCreated(created);
        await fetchKeys();
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : m.common_createFailed());
        return null;
      }
    },
    [fetchKeys]
  );

  const revokeKey = useCallback(
    async (id: string) => {
      try {
        await apiJson(`/api/keys/${id}`, { method: "DELETE" });
        await fetchKeys();
      } catch (err) {
        setError(err instanceof Error ? err.message : m.common_updateFailed());
      }
    },
    [fetchKeys]
  );

  return {
    keys,
    loading,
    error,
    newlyCreated,
    setNewlyCreated,
    createKey,
    revokeKey,
    refetch: fetchKeys,
  };
}
