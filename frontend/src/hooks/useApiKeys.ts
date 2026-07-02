/**
 * useApiKeys Hook
 */

import { useState, useCallback } from "react";
import { apiErr, apiJson } from "@/lib/api";
import { useResource } from "@/hooks/useResource";
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
  const { data, loading, error, setError, refetch } = useResource<ApiKey[]>(
    "/api/keys",
    m.common_loadFailed()
  );
  const [newlyCreated, setNewlyCreated] = useState<CreatedKey | null>(null);

  const keys = data ?? [];

  const createKey = useCallback(
    async (name: string, expiresInDays?: number): Promise<CreatedKey | null> => {
      try {
        const created = await apiJson<CreatedKey>("/api/keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, ...(expiresInDays ? { expiresInDays } : {}) }),
        });
        setNewlyCreated(created);
        await refetch();
        return created;
      } catch (err) {
        setError(apiErr(err, m.common_createFailed()));
        return null;
      }
    },
    [refetch, setError]
  );

  const revokeKey = useCallback(
    async (id: string) => {
      try {
        await apiJson(`/api/keys/${id}`, { method: "DELETE" });
        await refetch();
      } catch (err) {
        setError(apiErr(err, m.common_updateFailed()));
      }
    },
    [refetch, setError]
  );

  return {
    keys,
    loading,
    error,
    newlyCreated,
    setNewlyCreated,
    createKey,
    revokeKey,
    refetch,
  };
}
