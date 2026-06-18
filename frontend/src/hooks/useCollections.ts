/**
 * useCollections Hook
 */

import { useState, useEffect, useCallback } from "react";

export interface Collection {
  id: string;
  userId: string;
  name: string;
  color: string;
  description: string | null;
  createdAt: string;
  itemCount?: number;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Collection[]>("/api/collections");
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
        const created = await api<Collection>("/api/collections", {
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
        await api(`/api/collections/${id}`, {
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
        await api(`/api/collections/${id}`, { method: "DELETE" });
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
