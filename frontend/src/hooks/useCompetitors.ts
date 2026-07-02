/**
 * useCompetitors Hook
 */

import { useCallback } from "react";
import { apiErr, apiJson } from "@/lib/api";
import { useResource } from "@/hooks/useResource";
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
  const { data, loading, error, setError, refetch } = useResource<Competitor[]>(
    "/api/competitors",
    m.common_loadFailed()
  );

  const competitors = data ?? [];

  const createCompetitor = useCallback(
    async (input: Omit<Competitor, "id" | "createdAt">): Promise<Competitor | null> => {
      try {
        const created = await apiJson<Competitor>("/api/competitors", {
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

  const updateCompetitor = useCallback(
    async (id: string, input: Partial<Omit<Competitor, "id" | "createdAt">>): Promise<boolean> => {
      try {
        await apiJson(`/api/competitors/${id}`, {
          method: "PUT",
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

  const deleteCompetitor = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await apiJson(`/api/competitors/${id}`, { method: "DELETE" });
        await refetch();
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_deleteFailed()));
        return false;
      }
    },
    [refetch, setError]
  );

  return { competitors, loading, error, refetch, createCompetitor, updateCompetitor, deleteCompetitor };
}
