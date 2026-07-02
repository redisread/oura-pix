/**
 * useFeedback Hook
 */

import { useCallback } from "react";
import { apiErr, apiJson } from "@/lib/api";
import { useResource } from "@/hooks/useResource";
import * as m from "@/paraglide/messages.js";

export interface FeedbackItem {
  id: string;
  generationId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface FeedbackStats {
  generationId: string;
  count: number;
  avgRating: number | null;
}

export function useFeedback(generationId: string | null) {
  const {
    data: list,
    loading: listLoading,
    error: listError,
    setError: setListError,
    refetch: refetchList,
  } = useResource<FeedbackItem[]>(
    generationId ? `/api/feedback?generationId=${generationId}` : null,
    m.common_loadFailed()
  );

  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
    setError: setStatsError,
    refetch: refetchStats,
  } = useResource<FeedbackStats>(
    generationId ? `/api/feedback/stats?generationId=${generationId}` : null,
    m.common_loadFailed()
  );

  const submit = useCallback(
    async (rating: number, comment?: string): Promise<boolean> => {
      if (!generationId) return false;
      try {
        await apiJson(`/api/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generationId, rating, ...(comment ? { comment } : {}) }),
        });
        await refetchList();
        await refetchStats();
        return true;
      } catch (err) {
        const msg = apiErr(err, m.common_submitFailed());
        setListError(msg);
        setStatsError(msg);
        return false;
      }
    },
    [generationId, refetchList, refetchStats, setListError, setStatsError]
  );

  return {
    list: list ?? [],
    stats,
    loading: listLoading || statsLoading,
    error: listError ?? statsError,
    refetch: () => {
      void refetchList();
      void refetchStats();
    },
    submit,
  };
}
