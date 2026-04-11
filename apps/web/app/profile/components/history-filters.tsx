"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { TimeFilter } from "../types";

interface HistoryFiltersProps {
  timeFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

export function HistoryFilters({ timeFilter, onFilterChange }: HistoryFiltersProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  const filters: { value: TimeFilter; label: string }[] = [
    { value: "all", label: t("history.filter.all") },
    { value: "today", label: t("history.filter.today") },
    { value: "week", label: t("history.filter.week") },
    { value: "month", label: t("history.filter.month") },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-500">{tCommon("filter")}:</span>
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={timeFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}