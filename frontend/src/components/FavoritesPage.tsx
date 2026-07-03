/**
 * FavoritesPage Component
 *
 * Main page component for user favorites
 */

import { useState, useCallback } from "react";
import { Check, Download, Heart, Images, Trash2, X } from "lucide-react";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { useFavorites } from "@/hooks/useFavorites";
import type { Favorite } from "@/lib/api";
import { formatShortDate } from "@/lib/locale";
import { StateMessage } from "@/components/StateMessage";
import { WorkbenchPageLayout } from "@/components/layout/WorkbenchPageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import FavoriteCard from "./FavoriteCard";

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
    <Modal
      open={true}
      onClose={onClose}
      size="lg"
      overlay="fg-72"
      contentClassName="relative !p-0 overflow-hidden max-h-[90vh] !max-w-4xl shadow-2xl"
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
            {formatShortDate(favorite.createdAt)}
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
    </Modal>
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
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
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
    setConfirmBatchDelete(true);
  }, [selectedIds]);

  const executeBatchRemove = useCallback(async () => {
    await batchRemove(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectionMode(false);
    setConfirmBatchDelete(false);
  }, [batchRemove, selectedIds]);

  const handleBrowse = useCallback(() => {
    window.location.href = localizeHref("/generate");
  }, []);

  return (
    <WorkbenchPageLayout>
      <PageHeader
        kicker={m.favorites_kicker()}
        title={
          <span className="flex items-center gap-3">
            <Heart className="h-8 w-8 text-[hsl(var(--color-error))]" aria-hidden="true" />
            {m.favorites_title()}
          </span>
        }
        description={pagination ? m.favorites_total({ count: pagination.total.toString() }) : ""}
        actions={
          selectionMode ? (
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
          )
        }
      />

      {error && <StateMessage variant="error" message={error} onRetry={refresh} className="mb-4" />}

      {isLoading ? (
        <StateMessage variant="loading" />
      ) : favorites.length === 0 ? (
        <StateMessage
          variant="empty"
          title={m.favorites_empty()}
          description={m.favorites_emptyDescription()}
          icon={<Images className="h-16 w-16" aria-hidden="true" />}
          action={{ label: m.favorites_goGenerate(), onClick: handleBrowse }}
        />
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
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPrev={() => setPage(page - 1)}
              onNext={() => setPage(page + 1)}
            />
          )}
        </>
      )}

      {/* Image Modal */}
      {viewingFavorite && (
        <ImageModal
          favorite={viewingFavorite}
          onClose={() => setViewingFavorite(null)}
          onRemove={(id) => removeFavorite(id)}
        />
      )}
      <ConfirmModal
        open={confirmBatchDelete}
        onClose={() => setConfirmBatchDelete(false)}
        onConfirm={executeBatchRemove}
        title={m.favorites_unfavorite()}
        description={m.favorites_confirmBatchUnfavorite({ count: String(selectedIds.size) })}
        confirmLabel={m.common_confirm()}
      />
    </WorkbenchPageLayout>
  );
}
