/**
 * HistoryPage Component
 *
 * Main page component for generation history
 */

import { useCallback } from "react";
import { useGenerations } from "@/hooks/useGenerations";
import FilterBar from "./FilterBar";
import GenerationCard from "./GenerationCard";
import { deleteGeneration } from "@/lib/api";

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm border border-stone-200 dark:border-stone-700 animate-pulse">
      <div className="aspect-video bg-stone-200 dark:bg-stone-700" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded w-3/4" />
        <div className="flex justify-between">
          <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/4" />
          <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded w-1/4" />
        </div>
        <div className="flex gap-1">
          <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded w-12" />
          <div className="h-5 bg-stone-200 dark:bg-stone-700 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 mb-6 text-stone-300 dark:text-stone-600">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
        暂无生成记录
      </h3>
      <p className="text-stone-500 dark:text-stone-400 text-center mb-6 max-w-sm">
        开始使用 AI 生成精美的商品详情页图片吧
      </p>
      <button
        onClick={onGenerate}
        className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
      >
        开始生成
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

  const handleViewDetail = useCallback((id: string) => {
    window.location.href = `/generate?history=${id}`;
  }, []);

  const handleRegenerate = useCallback((id: string) => {
    window.location.href = `/generate?regenerate=${id}`;
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
    window.location.href = "/generate";
  }, []);

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              生成历史
            </h1>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-1">
              {pagination ? `共 ${pagination.total} 条记录` : ""}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建生成
          </button>
        </div>

        {/* Filters */}
        <FilterBar
          timeFilter={filter}
          onTimeFilterChange={setFilter}
          platformFilter={platform}
          onPlatformFilterChange={setPlatform}
          statusFilter={status}
          onStatusFilterChange={setStatus}
        />

        {/* Content */}
        <div className="mt-6">
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
                    onDelete={handleDelete}
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
      </div>
    </div>
  );
}
