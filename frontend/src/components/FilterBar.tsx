/**
 * FilterBar Component
 *
 * Filter controls for generation history
 */

import type { TimeFilter, PlatformFilter, StatusFilter } from "@/hooks/useGenerations";
import * as m from "@/paraglide/messages.js";

interface FilterBarProps {
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  platformFilter: PlatformFilter;
  onPlatformFilterChange: (platform: PlatformFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (status: StatusFilter) => void;
}

const timeFilters: { value: TimeFilter; label: string }[] = [
  { value: "all", label: m.history_filterAll() },
  { value: "today", label: m.history_filterToday() },
  { value: "week", label: m.history_filterWeek() },
  { value: "month", label: m.history_filterMonth() },
];

const platformFilters: { value: PlatformFilter; label: string; icon: string }[] = [
  { value: "all", label: m.history_filterAllPlatforms(), icon: "🌐" },
  { value: "amazon", label: "Amazon", icon: "🅰️" },
  { value: "shopify", label: "Shopify", icon: "🛍️" },
  { value: "ebay", label: "eBay", icon: "🏷️" },
  { value: "etsy", label: "Etsy", icon: "🎨" },
  { value: "generic", label: m.common_custom(), icon: "📦" },
];

const statusFilters: { value: StatusFilter; label: string; color: string }[] = [
  { value: "all", label: m.history_filterAllStatus(), color: "gray" },
  { value: "success", label: m.history_statusSuccess(), color: "green" },
  { value: "pending", label: m.history_statusPending(), color: "yellow" },
  { value: "failed", label: m.history_statusFailed(), color: "red" },
];

export default function FilterBar({
  timeFilter,
  onTimeFilterChange,
  platformFilter,
  onPlatformFilterChange,
  statusFilter,
  onStatusFilterChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-stone-50 dark:bg-stone-900 rounded-xl">
      {/* Time Filter */}
      <div className="flex flex-wrap gap-1">
        {timeFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => onTimeFilterChange(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              timeFilter === f.value
                ? "bg-amber-600 text-white"
                : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Platform Filter */}
      <div className="flex flex-wrap gap-1 sm:ml-auto">
        {platformFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => onPlatformFilterChange(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
              platformFilter === f.value
                ? "bg-amber-600 text-white"
                : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700"
            }`}
          >
            <span>{f.icon}</span>
            <span className="hidden sm:inline">{f.label}</span>
          </button>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-1">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => onStatusFilterChange(f.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              statusFilter === f.value
                ? "bg-amber-600 text-white"
                : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
