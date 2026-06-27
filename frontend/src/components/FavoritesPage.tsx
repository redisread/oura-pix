/**
 * FavoritesPage Component
 *
 * Main page component for user favorites
 */

import { useState, useCallback } from "react";
import { useFavorites, type Favorite } from "@/hooks/useFavorites";
import FavoriteCard from "./FavoriteCard";

function SkeletonCard() {
  return (
    <div className="aspect-square bg-stone-200 dark:bg-stone-700 rounded-xl animate-pulse" />
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 mb-6 text-stone-300 dark:text-stone-600">
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
        暂无收藏
      </h3>
      <p className="text-stone-500 dark:text-stone-400 text-center mb-6 max-w-sm">
        浏览生成结果，收藏您喜欢的图片
      </p>
      <button
        onClick={onBrowse}
        className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
      >
        去生成图片
      </button>
    </div>
  );
}

function ImageModal({
  favorite,
  onClose,
  onRemove,
}: {
  favorite: Favorite;
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <img
          src={favorite.imageUrl}
          alt="收藏图片"
          className="w-full h-full object-contain max-h-[80vh]"
          decoding="async"
        />

        {/* Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
          <div className="text-white text-sm">
            <span className="font-medium">
              {favorite.generation?.settings?.targetPlatform || "通用"}
            </span>
            <span className="ml-4 opacity-75">
              {new Date(favorite.createdAt).toLocaleDateString("zh-CN")}
            </span>
          </div>
          <div className="flex gap-2">
            <a
              href={favorite.imageUrl}
              download
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors"
            >
              下载
            </a>
            <button
              onClick={() => {
                onRemove(favorite.id);
                onClose();
              }}
              className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-sm transition-colors"
            >
              取消收藏
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FavoritesPage() {
  const {
    favorites,
    pagination,
    isLoading,
    error,
    page,
    setPage,
    refresh,
    removeFavorite,
    batchRemove,
  } = useFavorites();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingFavorite, setViewingFavorite] = useState<Favorite | null>(null);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.size === favorites.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(favorites.map((f) => f.id)));
    }
  }, [favorites, selectedIds]);

  const handleBatchRemove = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (!confirm(`确定要取消收藏 ${count} 张图片吗？`)) return;

    await batchRemove(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds, batchRemove]);

  const handleBrowse = useCallback(() => {
    window.location.href = "/generate";
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              我的收藏
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
              {pagination ? `共 ${pagination.total} 张收藏` : ""}
            </p>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  {selectedIds.size === favorites.length ? "取消全选" : "全选"}
                </button>
                <button
                  onClick={handleBatchRemove}
                  disabled={selectedIds.size === 0}
                  className="px-4 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  取消收藏 ({selectedIds.size})
                </button>
                <button
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="px-3 py-1.5 text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                >
                  取消
                </button>
              </>
            ) : (
              favorites.length > 0 && (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="px-4 py-1.5 text-sm bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-300 rounded-lg transition-colors"
                >
                  批量管理
                </button>
              )
            )}
          </div>
        </div>

        {/* Content */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
            >
              重试
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState onBrowse={handleBrowse} />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {favorites.map((fav) => (
                <FavoriteCard
                  key={fav.id}
                  favorite={fav}
                  isSelected={selectedIds.has(fav.id)}
                  onSelect={toggleSelect}
                  selectionMode={selectionMode}
                  onRemove={(id) => removeFavorite(id)}
                  onView={(f) => setViewingFavorite(f)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                >
                  上一页
                </button>
                <span className="text-sm text-stone-600 dark:text-stone-400">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Image Modal */}
      {viewingFavorite && (
        <ImageModal
          favorite={viewingFavorite}
          onClose={() => setViewingFavorite(null)}
          onRemove={(id) => removeFavorite(id)}
        />
      )}
    </div>
  );
}
