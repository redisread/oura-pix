/**
 * usePaginatedResource — 通用分页列表 Hook
 *
 * 将 useFavorites / useGenerations 重复的「分页状态 + loading/error +
 * 自动加载」模式收敛为一个泛型 hook。业务 hook 通过闭包传入各自的
 * fetch 逻辑（含客户端筛选等变异）。
 */

import { useState, useEffect, useCallback } from "react";
import { apiErr } from "@/lib/api";
import type { Pagination } from "@/lib/types";

export interface UsePaginatedResourceOptions {
  initialPage?: number;
  initialPageSize?: number;
  loadErrorMsg?: string;
}

export interface UsePaginatedResourceReturn<T> {
  items: T[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  refresh: () => Promise<void>;
}

export function usePaginatedResource<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[]; pagination: Pagination }>,
  options: UsePaginatedResourceOptions = {},
): UsePaginatedResourceReturn<T> {
  const { initialPage = 1, initialPageSize = 20, loadErrorMsg = "加载失败" } = options;

  const [items, setItems] = useState<T[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, initialPageSize);
      setItems(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(apiErr(err, loadErrorMsg));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, page, initialPageSize, loadErrorMsg]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, pagination, isLoading, error, page, setPage, refresh };
}
