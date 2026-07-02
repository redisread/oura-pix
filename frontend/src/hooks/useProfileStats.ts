/**
 * useProfileStats Hook
 *
 * Fetches user generation statistics from the API
 */

import { useState, useEffect, useCallback } from "react";
import { apiErr, apiJson } from "@/lib/api";
import * as m from "@/paraglide/messages.js";

export interface ProfileStats {
  totalGenerations: number;
  thisMonth: number;
  remainingCredits: number;
  favoriteStyle: string;
}

interface UseProfileStatsReturn {
  stats: ProfileStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

function styleLabel(style: string): string {
  switch (style) {
    case "professional":
      return m.style_professional_label();
    case "lifestyle":
      return m.style_lifestyle_label();
    case "minimal":
      return m.style_minimal_label();
    case "luxury":
      return m.style_luxury_label();
    default:
      return style;
  }
}

export function useProfileStats(): UseProfileStatsReturn {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiJson<{
        totalGenerations: number;
        thisMonth: number;
        remainingCredits: number;
        favoriteStyle: string;
      }>("/api/generations?stats=true");

      setStats({
        totalGenerations: data.totalGenerations,
        thisMonth: data.thisMonth,
        remainingCredits: data.remainingCredits,
        favoriteStyle: styleLabel(data.favoriteStyle),
      });
    } catch (err) {
      setError(apiErr(err, m.common_unknownError()));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    refresh: fetchStats,
  };
}
