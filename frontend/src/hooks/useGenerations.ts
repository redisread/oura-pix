/**
 * useGenerations Hook
 *
 * Data fetching hook for generation history
 */

import { useState, useEffect, useCallback } from "react";
import { getGenerations } from "@/lib/api";
import type { GenerationsListParams } from "@oura-pix/api-client";
import * as m from "@/paraglide/messages.js";

export type TimeFilter = "all" | "today" | "week" | "month";
export type PlatformFilter = "all" | "amazon" | "shopify" | "ebay" | "etsy" | "generic";
export type StatusFilter = "all" | "success" | "pending" | "failed";

export interface GenerationRecord {
  id: string;
  prompt: string | null;
  platform: string;
  style: string;
  language: string;
  count: number;
  productImageId: string | null;
  productImageUrl: string | null;
  referenceImageUrls: string[];
  generatedImages: string[];
  createdAt: string;
  status: string;
  errorMessage?: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

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
  refresh: () => void;
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

      // Note: Backend API currently only supports time filter
      // Platform and status filtering will be done client-side for now
      const response = await getGenerations(params);

      if (response.success) {
        let data = response.data as GenerationRecord[];

        // Client-side filtering for platform
        if (platform !== "all") {
          data = data.filter((g) => g.platform === platform);
        }

        // Client-side filtering for status
        if (status !== "all") {
          data = data.filter((g) => g.status === status);
        }

        setGenerations(data);
        setPagination(response.pagination as Pagination);
      } else {
        setError(response.error?.message || m.common_loadFailed());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : m.common_unknownError());
    } finally {
      setIsLoading(false);
    }
  }, [page, initialPageSize, filter, platform, status]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const refresh = useCallback(() => {
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
    refresh,
  };
}
