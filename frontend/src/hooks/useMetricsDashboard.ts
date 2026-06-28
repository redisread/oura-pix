/**
 * useMetricsDashboard Hook
 */

import { useState, useEffect, useCallback } from "react";
import { apiJson } from "@/lib/api";
import * as m from "@/paraglide/messages.js";

export type Rating = "good" | "needs-improvement" | "poor";

export interface MetricSummary {
  name: string;
  count: number;
  p50: number;
  p95: number;
  avg: number;
  goodPct: number;
  poorPct: number;
}

export interface MetricPoint {
  id: string;
  name: string;
  value: number;
  rating: Rating | null;
  url: string | null;
  deviceType: "mobile" | "tablet" | "desktop" | null;
  recordedAt: string;
}

export interface DashboardStats {
  range: string;
  metrics: MetricSummary[];
}

interface UseMetricsParams {
  range?: "1h" | "24h" | "7d" | "30d";
  selectedMetric?: string;
}

export function useMetricsDashboard(params: UseMetricsParams = {}) {
  const { range = "7d", selectedMetric = "LCP" } = params;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [points, setPoints] = useState<MetricPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboardStats, metricSeries] = await Promise.all([
        apiJson<DashboardStats>(`/api/metrics/dashboard?range=${range}`),
        apiJson<{ points: MetricPoint[] }>(`/api/metrics/${selectedMetric}?range=${range}&limit=50`),
      ]);
      setStats(dashboardStats);
      setPoints(metricSeries.points);
    } catch (err) {
      setError(err instanceof Error ? err.message : m.common_loadFailed());
    } finally {
      setLoading(false);
    }
  }, [range, selectedMetric]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { stats, points, loading, error, refetch: fetchAll };
}
