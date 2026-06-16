/**
 * useErrorDashboard Hook
 *
 * Fetches error list and stats for the /errors dashboard page.
 */

import { useState, useEffect, useCallback } from "react";

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

      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/errors?${query.toString()}`, { credentials: "include" }),
        fetch(`/api/errors/stats?range=${range}`, { credentials: "include" }),
      ]);

      if (!listRes.ok || !statsRes.ok) {
        throw new Error("Failed to fetch error data");
      }

      const [listJson, statsJson] = await Promise.all([listRes.json(), statsRes.json()]);

      if (listJson.success) setList(listJson.data);
      if (statsJson.success) setStats(statsJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load errors");
    } finally {
      setLoading(false);
    }
  }, [range, severity, type, module, page, pageSize]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const deleteOne = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/errors/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete error");
      await fetchAll();
    },
    [fetchAll]
  );

  const deleteMany = useCallback(
    async (ids: string[]) => {
      const res = await fetch("/api/errors/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to batch delete");
      await fetchAll();
    },
    [fetchAll]
  );

  return { list, stats, loading, error, refetch: fetchAll, deleteOne, deleteMany };
}
