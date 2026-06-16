/**
 * useMetricsDashboard Hook
 */

import { useState, useEffect, useCallback } from "react";

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
      const [statsRes, seriesRes] = await Promise.all([
        fetch(`/api/metrics/dashboard?range=${range}`, { credentials: "include" }),
        fetch(`/api/metrics/${selectedMetric}?range=${range}&limit=50`, { credentials: "include" }),
      ]);

      if (!statsRes.ok || !seriesRes.ok) {
        throw new Error("Failed to fetch metrics");
      }

      const [statsJson, seriesJson] = await Promise.all([statsRes.json(), seriesRes.json()]);

      if (statsJson.success) setStats(statsJson.data);
      if (seriesJson.success) setPoints(seriesJson.data.points);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  }, [range, selectedMetric]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { stats, points, loading, error, refetch: fetchAll };
}
