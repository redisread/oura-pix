/**
 * useProfileStats Hook
 *
 * Fetches user generation statistics from the API
 */

import { useResource } from "@/hooks/useResource";
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

interface RawStats {
  totalGenerations: number;
  thisMonth: number;
  remainingCredits: number;
  favoriteStyle: string;
}

export function useProfileStats(): UseProfileStatsReturn {
  const { data, loading, error, refetch } = useResource<RawStats>(
    "/api/generations?stats=true",
    m.common_unknownError()
  );

  const stats: ProfileStats | null = data
    ? {
        totalGenerations: data.totalGenerations,
        thisMonth: data.thisMonth,
        remainingCredits: data.remainingCredits,
        favoriteStyle: styleLabel(data.favoriteStyle),
      }
    : null;

  return {
    stats,
    isLoading: loading,
    error,
    refresh: () => void refetch(),
  };
}
