"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { GenerationRecord, PaginationInfo } from "../types";
import { HistoryItem } from "./history-item";
import { EmptyState } from "./empty-state";

interface GenerationHistoryProps {
  history: GenerationRecord[];
  pagination: PaginationInfo | null;
  isLoading: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  onViewDetail: (record: GenerationRecord) => void;
  onDelete: (id: string) => void;
}

export function GenerationHistory({
  history,
  pagination,
  isLoading,
  currentPage,
  onPageChange,
  onViewDetail,
  onDelete,
}: GenerationHistoryProps) {
  const t = useTranslations("profile");

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 border-b border-slate-200 last:border-b-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-16 w-16" />
                    <Skeleton className="h-16 w-16" />
                    <Skeleton className="h-16 w-16" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("history.title")}</CardTitle>
            <p className="mt-1 text-slate-600">{t("history.subtitle")}</p>
          </div>
          <p className="text-sm text-slate-500">
            {t("history.pagination.total", { count: pagination?.total || 0 })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {history.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="divide-y divide-slate-200">
              {history.map((item) => (
                <HistoryItem
                  key={item.id}
                  record={item}
                  onViewDetail={onViewDetail}
                  onDelete={onDelete}
                />
              ))}
            </div>

            {/* 分页 */}
            {pagination && pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t("history.pagination.prev")}
                </Button>
                <span className="text-sm text-slate-600">
                  {t("history.pagination.page")} {currentPage} {t("history.pagination.of")}{" "}
                  {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                >
                  {t("history.pagination.next")}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}