/**
 * useFeedback Hook
 */

import { useState, useCallback } from "react";

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

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
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
        api<FeedbackItem[]>(`/api/feedback?generationId=${generationId}`),
        api<FeedbackStats>(`/api/feedback/stats?generationId=${generationId}`),
      ]);
      setList(listData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [generationId]);

  const submit = useCallback(
    async (rating: number, comment?: string): Promise<boolean> => {
      if (!generationId) return false;
      try {
        await api(`/api/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ generationId, rating, ...(comment ? { comment } : {}) }),
        });
        await fetchAll();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit");
        return false;
      }
    },
    [generationId, fetchAll]
  );

  return { list, stats, loading, error, refetch: fetchAll, submit };
}
