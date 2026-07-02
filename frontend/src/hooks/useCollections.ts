/**
 * useCollections Hook
 */

import { useCallback } from "react";
import { apiErr, apiJson } from "@/lib/api";
import { useResource } from "@/hooks/useResource";
import * as m from "@/paraglide/messages.js";

export interface Collection {
  id: string;
  userId: string;
  name: string;
  color: string;
  description: string | null;
  createdAt: string;
  itemCount?: number;
}

export function useCollections() {
  const { data, loading, error, setError, refetch } = useResource<Collection[]>(
    "/api/collections",
    m.common_loadFailed()
  );

  const collections = data ?? [];

  const createCollection = useCallback(
    async (input: { name: string; color?: string; description?: string }): Promise<Collection | null> => {
      try {
        const created = await apiJson<Collection>("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await refetch();
        return created;
      } catch (err) {
        setError(apiErr(err, m.common_createFailed()));
        return null;
      }
    },
    [refetch, setError]
  );

  const updateCollection = useCallback(
    async (id: string, input: { name?: string; color?: string; description?: string }): Promise<boolean> => {
      try {
        await apiJson(`/api/collections/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await refetch();
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_updateFailed()));
        return false;
      }
    },
    [refetch, setError]
  );

  const deleteCollection = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await apiJson(`/api/collections/${id}`, { method: "DELETE" });
        await refetch();
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_deleteFailed()));
        return false;
      }
    },
    [refetch, setError]
  );

  return { collections, loading, error, refetch, createCollection, updateCollection, deleteCollection };
}
