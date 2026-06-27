/**
 * useCollections Hook
 */

import { useState, useEffect, useCallback } from "react";
import { apiJson } from "@/lib/api";

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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<Collection[]>("/api/collections");
      setCollections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const createCollection = useCallback(
    async (input: { name: string; color?: string; description?: string }): Promise<Collection | null> => {
      try {
        const created = await apiJson<Collection>("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await fetchCollections();
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create");
        return null;
      }
    },
    [fetchCollections]
  );

  const updateCollection = useCallback(
    async (id: string, input: { name?: string; color?: string; description?: string }): Promise<boolean> => {
      try {
        await apiJson(`/api/collections/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await fetchCollections();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
        return false;
      }
    },
    [fetchCollections]
  );

  const deleteCollection = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await apiJson(`/api/collections/${id}`, { method: "DELETE" });
        await fetchCollections();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
        return false;
      }
    },
    [fetchCollections]
  );

  return { collections, loading, error, refetch: fetchCollections, createCollection, updateCollection, deleteCollection };
}
