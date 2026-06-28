/**
 * useStats Hook
 *
 * Fetches and manages generation statistics
 */

import { useState, useEffect, useCallback } from 'react';
import { apiJson } from "@/lib/api";
import * as m from "@/paraglide/messages.js";

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export interface StatsData {
  totalGenerations: number;
  totalImages: number;
  avgGenerationTime: number;
  favoriteRate: number;
  byPlatform: { platform: string; count: number }[];
  byStyle: { style: string; count: number }[];
  trend: { date: string; count: number }[];
}

export function useStats(initialRange: TimeRange = '30d') {
  const [range, setRange] = useState<TimeRange>(initialRange);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        setData(await apiJson<StatsData>(`/api/stats?range=${range}`));
      } catch (err) {
        setError(err instanceof Error ? err.message : m.common_loadFailed());
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [range, refreshKey]);

  return {
    range,
    setRange,
    data,
    loading,
    error,
    refresh,
  };
}
