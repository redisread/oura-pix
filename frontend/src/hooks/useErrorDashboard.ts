/**
 * useErrorDashboard Hook
 *
 * Fetches error list and stats for the /errors dashboard page.
 */

import { useState, useEffect, useCallback } from "react";
import { apiErr, apiJson } from "@/lib/api";
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

  const [list, setList] = useState<ErrorListResponse | null>(null);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        range,
        page: String(page),
        pageSize: String(pageSize),
        ...(severity ? { severity } : {}),
        ...(type ? { type } : {}),
        ...(module ? { module } : {}),
      });

      const [listData, statsData] = await Promise.all([
        apiJson<ErrorListResponse>(`/api/errors?${query.toString()}`),
        apiJson<ErrorStats>(`/api/errors/stats?range=${range}`),
      ]);
      setList(listData);
      setStats(statsData);
    } catch (err) {
      setError(apiErr(err, m.common_loadFailed()));
    } finally {
      setLoading(false);
    }
  }, [range, severity, type, module, page, pageSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const deleteOne = useCallback(
    async (id: string) => {
      await apiJson(`/api/errors/${id}`, { method: "DELETE" });
      await fetchAll();
    },
    [fetchAll]
  );

  const deleteMany = useCallback(
    async (ids: string[]) => {
      await apiJson("/api/errors/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      await fetchAll();
    },
    [fetchAll]
  );

  return { list, stats, loading, error, refetch: fetchAll, deleteOne, deleteMany };
}
