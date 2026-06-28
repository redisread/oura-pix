/**
 * useFeedback Hook
 */

import { useState, useCallback } from "react";
import { apiJson } from "@/lib/api";
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
  const [list, setList] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!generationId) return;
    setLoading(true);
    setError(null);
    try {
      const [listData, statsData] = await Promise.all([
        apiJson<FeedbackItem[]>(`/api/feedback?generationId=${generationId}`),
        apiJson<FeedbackStats>(`/api/feedback/stats?generationId=${generationId}`),
      ]);
      setList(listData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : m.common_loadFailed());
    } finally {
      setLoading(false);
    }
  }, [generationId]);

  const submit = useCallback(
    async (rating: number, comment?: string): Promise<boolean> => {
      if (!generationId) return false;
      try {
        await apiJson(`/api/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generationId, rating, ...(comment ? { comment } : {}) }),
        });
        await fetchAll();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : m.common_submitFailed());
        return false;
      }
    },
    [generationId, fetchAll]
  );

  return { list, stats, loading, error, refetch: fetchAll, submit };
}
