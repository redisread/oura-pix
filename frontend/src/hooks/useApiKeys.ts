/**
 * useApiKeys Hook - 基于 useCrud 的 API Key 管理
 *
 * list / revoke 走 useCrud；createKey 需保留 newlyCreated 状态，
 * 因此独立实现并直接调用 apiJson。
 */

import { useState, useCallback } from "react";
import { apiErr, apiJson } from "@/lib/api";
import { useCrud } from "@/hooks/useCrud";
import * as m from "@/paraglide/messages.js";

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions?: "read" | "read-write";
  lastUsedAt: string | null;
  expiresAt: string | null;
  isRevoked: boolean;
  createdAt: string;
}

interface CreatedKey extends ApiKey {
  key: string; // full key — only present in create response
}

export function useApiKeys() {
  const { items, loading, error, setError, refetch, deleteItem } = useCrud<ApiKey>({
    endpoint: "/api/keys",
  });

  const [newlyCreated, setNewlyCreated] = useState<CreatedKey | null>(null);

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
      await deleteItem(id);
    },
    [deleteItem]
  );

  return {
    keys: items,
    loading,
    error,
    newlyCreated,
    setNewlyCreated,
    createKey,
    revokeKey,
    refetch,
  };
}
