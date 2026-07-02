/**
 * useMetricsDashboard Hook
 */

import { useResource } from "@/hooks/useResource";
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

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useResource<DashboardStats>(
    `/api/metrics/dashboard?range=${range}`,
    m.common_loadFailed()
  );

  const {
    data: seriesData,
    loading: seriesLoading,
    error: seriesError,
    refetch: refetchSeries,
  } = useResource<{ points: MetricPoint[] }>(
    `/api/metrics/${selectedMetric}?range=${range}&limit=50`,
    m.common_loadFailed()
  );

  return {
    stats,
    points: seriesData?.points ?? [],
    loading: statsLoading || seriesLoading,
    error: statsError ?? seriesError,
    refetch: () => {
      void refetchStats();
      void refetchSeries();
    },
  };
}
