/**
 * useStats Hook
 *
 * Fetches and manages generation statistics
 */

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/stats?range=${range}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch statistics');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [range]);

  return {
    range,
    setRange,
    data,
    loading,
    error,
  };
}
