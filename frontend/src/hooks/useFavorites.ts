/**
 * useFavorites Hook
 *
 * Data fetching hook for user favorites
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { ENDPOINTS } from "@oura-pix/api-client";

export interface Favorite {
  id: string;
  generationId: string;
  imageUrl: string;
  imageIndex: number | null;
  createdAt: string;
  generation: {
    id: string;
    status: string;
    settings: {
      targetPlatform?: string;
      style?: string;
      language?: string;
    };
    createdAt: string;
  } | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface UseFavoritesReturn {
  favorites: Favorite[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  setPage: (page: number) => void;
  refresh: () => void;
  addFavorite: (generationId: string, imageUrl: string, imageIndex?: number) => Promise<string | null>;
  removeFavorite: (id: string) => Promise<boolean>;
  batchRemove: (ids: string[]) => Promise<number>;
  checkFavorite: (imageUrl: string) => Promise<{ isFavorited: boolean; favoriteId: string | null }>;
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
      const response = await api.get(ENDPOINTS.favorites.list, {
        params: { page, pageSize: initialPageSize },
      });

      if (response.data.success) {
        setFavorites(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.data.error?.message || "Failed to fetch favorites");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [page, initialPageSize]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const refresh = useCallback(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = useCallback(
    async (generationId: string, imageUrl: string, imageIndex?: number): Promise<string | null> => {
      try {
        const response = await api.post(ENDPOINTS.favorites.add, {
          generationId,
          imageUrl,
          imageIndex,
        });

        if (response.data.success) {
          return response.data.data.id;
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  const removeFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await api.delete(ENDPOINTS.favorites.remove(id));
        if (response.data.success) {
          setFavorites((prev) => prev.filter((f) => f.id !== id));
          setPagination((prev) =>
            prev ? { ...prev, total: prev.total - 1 } : prev
          );
          return true;
        }
        return false;
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
        const response = await api.post(ENDPOINTS.favorites.batchDelete, { ids });
        if (response.data.success) {
          const deleted = response.data.data.deleted;
          setFavorites((prev) => prev.filter((f) => !ids.includes(f.id)));
          setPagination((prev) =>
            prev ? { ...prev, total: prev.total - deleted } : prev
          );
          return deleted;
        }
        return 0;
      } catch {
        return 0;
      }
    },
    []
  );

  const checkFavorite = useCallback(
    async (imageUrl: string): Promise<{ isFavorited: boolean; favoriteId: string | null }> => {
      try {
        const response = await api.get(ENDPOINTS.favorites.check(imageUrl));
        if (response.data.success) {
          return response.data.data;
        }
        return { isFavorited: false, favoriteId: null };
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
    refresh,
    addFavorite,
    removeFavorite,
    batchRemove,
    checkFavorite,
  };
}
