/**
 * useCompetitors Hook
 */

import { useCrud } from "@/hooks/useCrud";

export type Platform = "amazon" | "shopify" | "etsy" | "ebay" | "taobao" | "jd" | "tmall" | "self" | "other";

export const PLATFORMS: Platform[] = ["amazon", "shopify", "etsy", "ebay", "taobao", "jd", "tmall", "self", "other"];

export { getPlatformLabel } from "@/lib/format";

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
  const { items, loading, error, refetch, createItem, updateItem, deleteItem } =
    useCrud<Competitor>({ endpoint: "/api/competitors", updateMethod: "PUT" });

  return {
    competitors: items,
    loading,
    error,
    refetch,
    createCompetitor: createItem,
    updateCompetitor: updateItem,
    deleteCompetitor: deleteItem,
  };
}
