/**
 * HistoryPage Component
 *
 * Main page component for generation history
 */

import { useCallback, useState } from "react";
import { PackageOpen, Plus } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { useGenerations } from "@/hooks/useGenerations";
import FilterBar from "./FilterBar";
import GenerationCard from "./GenerationCard";
import ImageEditor from "./editor/ImageEditor";
import { deleteGeneration, updateGenerationImage } from "@/lib/api";

function SkeletonCard() {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="aspect-video bg-[hsl(var(--secondary))]" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded bg-[hsl(var(--secondary))]" />
        <div className="flex justify-between">
          <div className="h-3 w-1/4 rounded bg-[hsl(var(--secondary))]" />
          <div className="h-3 w-1/4 rounded bg-[hsl(var(--secondary))]" />
        </div>
        <div className="flex gap-1">
          <div className="h-5 w-12 rounded bg-[hsl(var(--secondary))]" />
          <div className="h-5 w-12 rounded bg-[hsl(var(--secondary))]" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="panel-muted flex flex-col items-center justify-center px-4 py-16">
      <PackageOpen className="mb-6 h-16 w-16 text-foreground-muted" aria-hidden="true" />
      <h2 className="mb-2 text-lg font-semibold text-foreground">
        {m.history_empty()}
      </h2>
      <p className="mb-6 max-w-sm text-center text-sm text-foreground-muted">
        {m.history_emptyDescription()}
      </p>
      <button
        onClick={onGenerate}
        className="btn-primary h-10 gap-2 px-6"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {m.history_startGenerate()}
      </button>
    </div>
  );
}

export default function HistoryPage() {
  const {
    generations,
    pagination,
    isLoading,
    error,
    page,
    setPage,
    filter,
    setFilter,
    platform,
    setPlatform,
    status,
    setStatus,
    refresh,
  } = useGenerations();

  const [editingContext, setEditingContext] = useState<{ genId: string; imageUrl: string; imageIndex: number } | null>(null);

  const handleViewDetail = useCallback((id: string) => {
    window.location.href = localizeHref(`/generate?history=${id}`);
  }, []);

  const handleRegenerate = useCallback((id: string) => {
    window.location.href = localizeHref(`/generate?regenerate=${id}`);
  }, []);

  const handleEdit = useCallback((genId: string, imageUrl: string, imageIndex = 0) => {
    setEditingContext({ genId, imageUrl, imageIndex });
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteGeneration(id);
        refresh();
      } catch (err) {
        console.error("Delete failed:", err);
      }
    },
    [refresh]
  );

  const handleGenerate = useCallback(() => {
    window.location.href = localizeHref("/generate");
  }, []);

  return (
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">{m.history_kicker()}</p>
            <h1 className="page-title mt-2">
              {m.history_title()}
            </h1>
            <p className="page-description mt-2">
              {pagination ? m.history_totalRecords({ count: pagination.total.toString() }) : ""}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="btn-primary h-10 gap-2 px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {m.history_newGenerate()}
          </button>
        </header>

        <FilterBar
          timeFilter={filter}
          onTimeFilterChange={setFilter}
          platformFilter={platform}
          onPlatformFilterChange={setPlatform}
          statusFilter={status}
          onStatusFilterChange={setStatus}
        />

        <div className="mt-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : generations.length === 0 ? (
            <EmptyState onGenerate={handleGenerate} />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {generations.map((gen) => (
                  <GenerationCard
                    key={gen.id}
                    generation={gen}
                    onViewDetail={handleViewDetail}
                    onRegenerate={handleRegenerate}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
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
      </div>

      {/* Image Editor Modal */}
      {editingContext && (
        <ImageEditor
          imageUrl={editingContext.imageUrl}
          onClose={() => setEditingContext(null)}
          onSave={async (blob) => {
            if (!editingContext) return;
            try {
              await updateGenerationImage(editingContext.genId, blob, editingContext.imageIndex);
              refresh();
            } catch (err) {
              console.error("Save edited image failed:", err);
              alert(err instanceof Error ? err.message : "Save failed");
            }
            setEditingContext(null);
          }}
        />
      )}
    </div>
  );
}
