/**
 * useCompetitors Hook
 */

import { useState, useEffect, useCallback } from "react";
import { apiJson } from "@/lib/api";
import * as m from "@/paraglide/messages.js";

export type Platform = "amazon" | "shopify" | "etsy" | "ebay" | "taobao" | "jd" | "tmall" | "self" | "other";

export const PLATFORMS: Platform[] = ["amazon", "shopify", "etsy", "ebay", "taobao", "jd", "tmall", "self", "other"];

export function getPlatformLabel(platform: Platform): string {
  switch (platform) {
    case "amazon":
      return m.competitors_platformAmazon();
    case "shopify":
      return m.competitors_platformShopify();
    case "etsy":
      return m.competitors_platformEtsy();
    case "ebay":
      return m.competitors_platformEbay();
    case "taobao":
      return m.competitors_platformTaobao();
    case "jd":
      return m.competitors_platformJd();
    case "tmall":
      return m.competitors_platformTmall();
    case "self":
      return m.competitors_platformSelf();
    case "other":
      return m.competitors_platformOther();
  }
}

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
      setError(err instanceof Error ? err.message : m.common_loadFailed());
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
        setError(err instanceof Error ? err.message : m.common_createFailed());
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
        setError(err instanceof Error ? err.message : m.common_updateFailed());
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
        setError(err instanceof Error ? err.message : m.common_deleteFailed());
        return false;
      }
    },
    [fetchCompetitors]
  );

  return { competitors, loading, error, refetch: fetchCompetitors, createCompetitor, updateCompetitor, deleteCompetitor };
}
