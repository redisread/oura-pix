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

const platformFilters: { value: PlatformFilter; label: string }[] = [
  { value: "all", label: m.history_filterAllPlatforms() },
  { value: "amazon", label: "Amazon" },
  { value: "shopify", label: "Shopify" },
  { value: "ebay", label: "eBay" },
  { value: "etsy", label: "Etsy" },
  { value: "generic", label: m.common_custom() },
];

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: m.history_filterAllStatus() },
  { value: "success", label: m.history_statusSuccess() },
  { value: "pending", label: m.history_statusPending() },
  { value: "failed", label: m.history_statusFailed() },
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
    <div className="panel flex flex-col gap-3 p-3 sm:flex-row">
      <div className="flex flex-wrap gap-1">
        {timeFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => onTimeFilterChange(f.value)}
            className={`segmented-option ${timeFilter === f.value ? "segmented-option-active" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1 sm:ml-auto">
        {platformFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => onPlatformFilterChange(f.value)}
            className={`segmented-option ${platformFilter === f.value ? "segmented-option-active" : ""}`}
          >
            <span>{f.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => onStatusFilterChange(f.value)}
            className={`segmented-option ${statusFilter === f.value ? "segmented-option-active" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
