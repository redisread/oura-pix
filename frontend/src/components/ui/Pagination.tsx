/**
 * Pagination — 分页控制器
 *
 * 统一 Favorites / History 等列表页的分页按钮 + 页码指示。
 */

import * as m from "@/paraglide/messages.js";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function Pagination({ page, totalPages, onPrev, onNext }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="btn-secondary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {m.common_previousPage()}
      </button>
      <span className="font-utility text-sm text-foreground-muted">
        {page} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="btn-secondary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {m.common_nextPage()}
      </button>
    </div>
  );
}
