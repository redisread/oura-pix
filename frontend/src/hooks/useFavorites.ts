/**
 * useFavorites Hook
 *
 * Data fetching hook for user favorites.
 * Uses the apiJson envelope-unwrapping pattern; errors surface only on network/HTTP failure.
 */

import { useState, useEffect, useCallback } from "react";
import {
  apiErr,
  getFavorites,
  addFavorite,
  removeFavorite,
  batchRemoveFavorites,
  checkFavorite,
} from "@/lib/api";
import type { Favorite } from "@/lib/api";
import type { Pagination } from "@/lib/types";
import * as m from "@/paraglide/messages.js";

interface UseFavoritesReturn {
  favorites: Favorite[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  addFavorite: (generationId: string, imageUrl: string, imageIndex?: number) => Promise<Favorite | null>;
  removeFavorite: (id: string) => Promise<boolean>;
  batchRemove: (ids: string[]) => Promise<number>;
  checkFavorite: (imageUrl: string) => Promise<{ isFavorited: boolean; favoriteId: string | null }>;
  refresh: () => Promise<void>;
}

export function useFavorites(initialPageSize = 24): UseFavoritesReturn {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getFavorites(page, initialPageSize);
      setFavorites(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(apiErr(err, m.common_loadFailed()));
    } finally {
      setIsLoading(false);
    }
  }, [page, initialPageSize]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleAdd = useCallback(
    async (generationId: string, imageUrl: string, imageIndex?: number): Promise<Favorite | null> => {
      try {
        const fav = await addFavorite(generationId, imageUrl, imageIndex);
        await fetchFavorites();
        return fav;
      } catch {
        return null;
      }
    },
    [fetchFavorites]
  );

  const handleRemove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await removeFavorite(id);
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        setPagination((prev) =>
          prev ? { ...prev, total: prev.total - 1 } : prev
        );
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const batchRemove = useCallback(
    async (ids: string[]): Promise<number> => {
      if (ids.length === 0) return 0;
      try {
        const deleted = await batchRemoveFavorites(ids);
        setFavorites((prev) => prev.filter((f) => !ids.includes(f.id)));
        setPagination((prev) =>
          prev ? { ...prev, total: prev.total - deleted } : prev
        );
        return deleted;
      } catch {
        return 0;
      }
    },
    []
  );

  const handleCheck = useCallback(
    async (imageUrl: string): Promise<{ isFavorited: boolean; favoriteId: string | null }> => {
      try {
        return await checkFavorite(imageUrl);
      } catch {
        return { isFavorited: false, favoriteId: null };
      }
    },
    []
  );

  return {
    favorites,
    pagination,
    isLoading,
    error,
    page,
    setPage,
    refresh: fetchFavorites,
    addFavorite: handleAdd,
    removeFavorite: handleRemove,
    batchRemove,
    checkFavorite: handleCheck,
  };
}
