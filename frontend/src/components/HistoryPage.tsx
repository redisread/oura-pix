/**
 * HistoryPage Component
 *
 * Main page component for generation history
 */

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { useGenerations } from "@/hooks/useGenerations";
import { StateMessage } from "@/components/StateMessage";
import { WorkbenchPageLayout } from "@/components/layout/WorkbenchPageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import FilterBar from "./FilterBar";
import GenerationCard from "./GenerationCard";
import ImageEditor from "./editor/ImageEditor";
import { deleteGeneration, updateGenerationImage } from "@/lib/api";

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
    <WorkbenchPageLayout>
      <PageHeader
        kicker={m.history_kicker()}
        title={m.history_title()}
        description={pagination ? m.history_totalRecords({ count: pagination.total.toString() }) : ""}
        actions={
          <button onClick={handleGenerate} className="btn-primary h-10 gap-2 px-4">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {m.history_newGenerate()}
          </button>
        }
      />

      <FilterBar
        timeFilter={filter}
        onTimeFilterChange={setFilter}
        platformFilter={platform}
        onPlatformFilterChange={setPlatform}
        statusFilter={status}
        onStatusFilterChange={setStatus}
      />

      <div className="mt-6">
        {error && <StateMessage variant="error" message={error} onRetry={refresh} className="mb-4" />}

        {isLoading ? (
          <StateMessage variant="loading" />
        ) : generations.length === 0 ? (
          <StateMessage
            variant="empty"
            title={m.history_empty()}
            description={m.history_emptyDescription()}
            action={{ label: m.history_startGenerate(), onClick: handleGenerate }}
          />
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
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPrev={() => setPage(page - 1)}
                onNext={() => setPage(page + 1)}
              />
            )}
          </>
        )}
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
    </WorkbenchPageLayout>
  );
}
