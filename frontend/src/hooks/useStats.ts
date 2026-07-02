/**
 * useStats Hook
 *
 * Fetches and manages generation statistics
 */

import { useState } from "react";
import { useResource } from "@/hooks/useResource";
import * as m from "@/paraglide/messages.js";

export type TimeRange = "7d" | "30d" | "90d" | "all";

export interface StatsData {
  totalGenerations: number;
  totalImages: number;
  avgGenerationTime: number;
  favoriteRate: number;
  byPlatform: { platform: string; count: number }[];
  byStyle: { style: string; count: number }[];
  trend: { date: string; count: number }[];
}

export function useStats(initialRange: TimeRange = "30d") {
  const [range, setRange] = useState<TimeRange>(initialRange);
  const { data, loading, error, setError, refetch } = useResource<StatsData>(
    `/api/stats?range=${range}`,
    m.common_loadFailed()
  );

  return { range, setRange, data, loading, error, refresh: refetch };
}
