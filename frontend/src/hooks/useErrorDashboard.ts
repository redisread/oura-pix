/**
 * useErrorDashboard Hook
 *
 * Fetches error list and stats for the /errors dashboard page.
 */

import { useCallback, useMemo } from "react";
import { apiJson } from "@/lib/api";
import { useResource } from "@/hooks/useResource";
import * as m from "@/paraglide/messages.js";

export interface ErrorRecord {
  id: string;
  message: string;
  stack: string | null;
  severity: "critical" | "high" | "medium" | "low";
  type: "network" | "validation" | "authentication" | "business_logic" | "runtime" | "unknown";
  module: "api" | "frontend" | "worker" | "database";
  context: string | null;
  hash: string;
  occurrences: number;
  lastSeenAt: string;
  createdAt: string;
}

export interface ErrorStats {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  topErrors: ErrorRecord[];
}

export interface ErrorListResponse {
  data: ErrorRecord[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface UseErrorDashboardParams {
  range?: "24h" | "7d" | "30d";
  severity?: string;
  type?: string;
  module?: string;
  page?: number;
  pageSize?: number;
}

export function useErrorDashboard(params: UseErrorDashboardParams = {}) {
  const { range = "7d", severity, type, module, page = 1, pageSize = 20 } = params;

  const listQuery = useMemo(() => {
    const q = new URLSearchParams({
      range,
      page: String(page),
      pageSize: String(pageSize),
      ...(severity ? { severity } : {}),
      ...(type ? { type } : {}),
      ...(module ? { module } : {}),
    });
    return `/api/errors?${q.toString()}`;
  }, [range, severity, type, module, page, pageSize]);

  const {
    data: list,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useResource<ErrorListResponse>(listQuery, m.common_loadFailed());

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useResource<ErrorStats>(`/api/errors/stats?range=${range}`, m.common_loadFailed());

  const refetch = useCallback(() => {
    void refetchList();
    void refetchStats();
  }, [refetchList, refetchStats]);

  const deleteOne = useCallback(
    async (id: string) => {
      await apiJson(`/api/errors/${id}`, { method: "DELETE" });
      refetch();
    },
    [refetch]
  );

  const deleteMany = useCallback(
    async (ids: string[]) => {
      await apiJson("/api/errors/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      refetch();
    },
    [refetch]
  );

  return {
    list,
    stats,
    loading: listLoading || statsLoading,
    error: listError ?? statsError,
    refetch,
    deleteOne,
    deleteMany,
  };
}
