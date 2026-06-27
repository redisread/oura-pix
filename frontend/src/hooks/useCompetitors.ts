/**
 * useCompetitors Hook
 */

import { useState, useEffect, useCallback } from "react";
import { apiJson } from "@/lib/api";

export type Platform = "amazon" | "shopify" | "etsy" | "ebay" | "taobao" | "jd" | "tmall" | "self" | "other";

export const PLATFORM_LABELS: Record<Platform, string> = {
  amazon: "Amazon",
  shopify: "Shopify",
  etsy: "Etsy",
  ebay: "eBay",
  taobao: "淘宝",
  jd: "京东",
  tmall: "天猫",
  self: "自营网站",
  other: "其他",
};

export interface Competitor {
  id: string;
  name: string;
  url: string;
  platform: Platform;
  notes: string | null;
  screenshots: string[];
  createdAt: string;
}

export function useCompetitors() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompetitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<Competitor[]>("/api/competitors");
      setCompetitors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load competitors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  const createCompetitor = useCallback(
    async (input: Omit<Competitor, "id" | "createdAt">): Promise<Competitor | null> => {
      try {
        const created = await apiJson<Competitor>("/api/competitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await fetchCompetitors();
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create");
        return null;
      }
    },
    [fetchCompetitors]
  );

  const updateCompetitor = useCallback(
    async (id: string, input: Partial<Omit<Competitor, "id" | "createdAt">>): Promise<boolean> => {
      try {
        await apiJson(`/api/competitors/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await fetchCompetitors();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
        return false;
      }
    },
    [fetchCompetitors]
  );

  const deleteCompetitor = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await apiJson(`/api/competitors/${id}`, { method: "DELETE" });
        await fetchCompetitors();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
        return false;
      }
    },
    [fetchCompetitors]
  );

  return { competitors, loading, error, refetch: fetchCompetitors, createCompetitor, updateCompetitor, deleteCompetitor };
}
