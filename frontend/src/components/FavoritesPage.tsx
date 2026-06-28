/**
 * FavoritesPage Component
 *
 * Main page component for user favorites
 */

import { useState, useCallback } from "react";
import { Check, Download, Heart, Images, Sparkles, Trash2, X } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { useFavorites, type Favorite } from "@/hooks/useFavorites";
import { formatLocaleDate } from "@/lib/locale";
import FavoriteCard from "./FavoriteCard";

function SkeletonCard() {
  return (
    <div className="card aspect-square animate-pulse bg-[hsl(var(--secondary))]" />
  );
}

function EmptyState({ onBrowse }: { onBrowse: () => void }) {
  return (
    <div className="panel-muted flex flex-col items-center justify-center px-4 py-16">
      <Images className="mb-6 h-16 w-16 text-foreground-muted" aria-hidden="true" />
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        {m.favorites_empty()}
      </h2>
      <p className="mb-6 max-w-sm text-center text-sm text-foreground-muted">
        {m.favorites_emptyDescription()}
      </p>
      <button
        onClick={onBrowse}
        className="btn-primary h-10 gap-2 px-6"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        {m.favorites_goGenerate()}
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground)/0.72)] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="favorite-modal-title"
    >
      <div
        className="panel relative max-h-[90vh] max-w-4xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="icon-button absolute right-4 top-4 z-10 h-10 w-10 bg-[hsl(var(--card)/0.88)] text-foreground hover:bg-[hsl(var(--card))]"
          aria-label={m.favorites_closePreview()}
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <img
          src={favorite.imageUrl}
          alt={m.favorite_imageAlt()}
          className="w-full h-full object-contain max-h-[80vh]"
          decoding="async"
        />

        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-[hsl(var(--foreground)/0.78)] p-4">
          <div id="favorite-modal-title" className="text-sm text-[hsl(var(--background))]">
            <span className="font-semibold">
              {favorite.generation?.settings?.targetPlatform || m.common_custom()}
            </span>
            <span className="ml-4 opacity-75">
              {formatLocaleDate(favorite.createdAt)}
            </span>
          </div>
          <div className="flex gap-2">
            <a
              href={favorite.imageUrl}
              download
              className="btn-secondary h-10 gap-2 bg-[hsl(var(--card)/0.9)] px-4 text-foreground"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              {m.favorites_download()}
            </a>
            <button
              onClick={() => {
                onRemove(favorite.id);
                onClose();
              }}
              className="btn-primary h-10 gap-2 bg-[hsl(var(--color-error))] px-4 hover:bg-[hsl(var(--color-error))]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {m.favorite_remove()}
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
    if (!confirm(m.favorites_confirmBatchUnfavorite({ count: count.toString() }))) return;

    await batchRemove(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds, batchRemove]);

  const handleBrowse = useCallback(() => {
    window.location.href = localizeHref("/generate");
  }, []);

  return (
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">{m.favorites_kicker()}</p>
            <h1 className="page-title mt-2 flex items-center gap-3">
              <Heart className="h-8 w-8 text-[hsl(var(--color-error))]" aria-hidden="true" />
              {m.favorites_title()}
            </h1>
            <p className="page-description mt-2">
              {pagination ? m.favorites_total({ count: pagination.total.toString() }) : ""}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <button
                  onClick={selectAll}
                  className="btn-secondary h-9 gap-2 px-3"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  {selectedIds.size === favorites.length ? m.favorites_deselectAll() : m.favorites_selectAll()}
                </button>
                <button
                  onClick={handleBatchRemove}
                  disabled={selectedIds.size === 0}
                  className="btn-primary h-9 gap-2 bg-[hsl(var(--color-error))] px-4 hover:bg-[hsl(var(--color-error))] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  {m.favorite_remove()} ({selectedIds.size})
                </button>
                <button
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="btn-ghost h-9 px-3"
                >
                  {m.common_cancel()}
                </button>
              </>
            ) : (
              favorites.length > 0 && (
                <button
                  onClick={() => setSelectionMode(true)}
                  className="btn-secondary h-9 px-4"
                >
                  {m.favorites_batchManage()}
                </button>
              )
            )}
          </div>
        </header>

        {error && (
          <div className="error-banner mb-4">
            <p>{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-sm font-semibold underline hover:no-underline"
            >
              {m.common_retry()}
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

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn-secondary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {m.common_previousPage()}
                </button>
                <span className="font-utility text-sm text-foreground-muted">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="btn-secondary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {m.common_nextPage()}
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
