/**
 * useGenerations Hook
 *
 * Data fetching hook for generation history.
 */

import { useState, useEffect, useCallback } from "react";
import { apiErr, getGenerationsList } from "@/lib/api";
import type { GenerationRecord } from "@/lib/api";
import type { Pagination } from "@/lib/types";
import type { GenerationsListParams } from "@oura-pix/api-client";
import * as m from "@/paraglide/messages.js";

export type TimeFilter = "all" | "today" | "week" | "month";
export type PlatformFilter = "all" | "amazon" | "shopify" | "ebay" | "etsy" | "generic";
export type StatusFilter = "all" | "success" | "pending" | "failed";

interface UseGenerationsOptions {
  initialPage?: number;
  initialPageSize?: number;
  initialFilter?: TimeFilter;
  platform?: PlatformFilter;
  status?: StatusFilter;
}

interface UseGenerationsReturn {
  generations: GenerationRecord[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  filter: TimeFilter;
  setFilter: (filter: TimeFilter) => void;
  platform: PlatformFilter;
  setPlatform: (platform: PlatformFilter) => void;
  status: StatusFilter;
  setStatus: (status: StatusFilter) => void;
  refresh: () => Promise<void>;
}

export function useGenerations(options: UseGenerationsOptions = {}): UseGenerationsReturn {
  const { initialPage = 1, initialPageSize = 20, initialFilter = "all" } = options;

  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [filter, setFilter] = useState<TimeFilter>(initialFilter);
  const [platform, setPlatform] = useState<PlatformFilter>(options.platform || "all");
  const [status, setStatus] = useState<StatusFilter>(options.status || "all");

  const fetchGenerations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: GenerationsListParams = {
        page,
        pageSize: initialPageSize,
        filter,
      };

      const result = await getGenerationsList(params);

      // Note: Backend API currently only supports time filter.
      // Platform and status filtering are client-side until the API supports them.
      let data = result.data;
      if (platform !== "all") {
        data = data.filter((g) => g.platform === platform);
      }
      if (status !== "all") {
        data = data.filter((g) => g.status === status);
      }

      setGenerations(data);
      setPagination(result.pagination);
    } catch (err) {
      setError(apiErr(err, m.common_loadFailed()));
    } finally {
      setIsLoading(false);
    }
  }, [page, initialPageSize, filter, platform, status]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  return {
    generations,
    pagination,
    isLoading,
    error,
    page,
    setPage,
    filter,
    setFilter,
    platform,
    setPlatform,
    status,
    setStatus,
    refresh: fetchGenerations,
  };
}
