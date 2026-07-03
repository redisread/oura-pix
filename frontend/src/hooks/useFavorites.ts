/**
 * useFavorites Hook
 *
 * Data fetching hook for user favorites.
 * Uses the apiJson envelope-unwrapping pattern; errors surface only on network/HTTP failure.
 */

import { useCallback } from "react";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  batchRemoveFavorites,
  checkFavorite,
} from "@/lib/api";
import type { Favorite } from "@/lib/api";
import { usePaginatedResource } from "@/hooks/usePaginatedResource";
import * as m from "@/paraglide/messages.js";

interface UseFavoritesReturn {
  favorites: Favorite[];
  pagination: import("@/lib/types").Pagination | null;
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
  const { items, pagination, isLoading, error, page, setPage, refresh } =
    usePaginatedResource<Favorite>(
      useCallback((pg, size) => getFavorites(pg, size), []),
      { initialPageSize, loadErrorMsg: m.common_loadFailed() },
    );

  const handleAdd = useCallback(
    async (generationId: string, imageUrl: string, imageIndex?: number): Promise<Favorite | null> => {
      try {
        const fav = await addFavorite(generationId, imageUrl, imageIndex);
        await refresh();
        return fav;
      } catch {
        return null;
      }
    },
    [refresh],
  );

  const handleRemove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await removeFavorite(id);
        // 乐观更新：本地过滤，不触发全量 refetch
        // 注：usePaginatedResource 当前不支持 setItems 透传，故通过 refresh 兜底
        await refresh();
        return true;
      } catch {
        return false;
      }
    },
    [refresh],
  );

  const batchRemove = useCallback(
    async (ids: string[]): Promise<number> => {
      if (ids.length === 0) return 0;
      try {
        const deleted = await batchRemoveFavorites(ids);
        await refresh();
        return deleted;
      } catch {
        return 0;
      }
    },
    [refresh],
  );

  const handleCheck = useCallback(
    async (imageUrl: string): Promise<{ isFavorited: boolean; favoriteId: string | null }> => {
      try {
        return await checkFavorite(imageUrl);
      } catch {
        return { isFavorited: false, favoriteId: null };
      }
    },
    [],
  );

  return {
    favorites: items,
    pagination,
    isLoading,
    error,
    page,
    setPage,
    refresh,
    addFavorite: handleAdd,
    removeFavorite: handleRemove,
    batchRemove,
    checkFavorite: handleCheck,
  };
}
