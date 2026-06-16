/**
 * useApiKeys Hook
 */

import { useState, useEffect, useCallback } from "react";

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
      const res = await fetch("/api/keys", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch API keys");
      const json = await res.json();
      if (json.success) setKeys(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
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
        const res = await fetch("/api/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name, ...(expiresInDays ? { expiresInDays } : {}) }),
        });
        if (!res.ok) throw new Error("Failed to create API key");
        const json = await res.json();
        if (json.success) {
          setNewlyCreated(json.data);
          await fetchKeys();
          return json.data as CreatedKey;
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create API key");
        return null;
      }
    },
    [fetchKeys]
  );

  const revokeKey = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/keys/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to revoke API key");
        await fetchKeys();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to revoke API key");
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
