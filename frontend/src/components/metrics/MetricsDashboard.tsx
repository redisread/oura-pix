/**
 * MetricsDashboard Component
 *
 * Displays Web Vitals aggregates (P50/P95/avg + good/poor distribution)
 * and a recent-points table.
 */

"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useMetricsDashboard, type MetricSummary } from "@/hooks/useMetricsDashboard";
import { StateMessage } from "@/components/StateMessage";
import { formatShortDateTime } from "@/lib/locale";
import * as m from "@/paraglide/messages.js";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkbenchPageLayout } from "@/components/layout/WorkbenchPageLayout";

type RangeFilter = "1h" | "24h" | "7d" | "30d";

const CORE_METRICS = ["LCP", "INP", "CLS", "FCP", "TTFB"] as const;

const METRIC_UNITS: Record<string, string> = {
  LCP: "ms",
  INP: "ms",
  CLS: "",
  FCP: "ms",
  TTFB: "ms",
};

function ratingClass(rating: "good" | "needs-improvement" | "poor" | null | undefined): string {
  if (rating === "good") return "status-badge-success";
  if (rating === "needs-improvement") return "status-badge-warning";
  if (rating === "poor") return "status-badge-error";
  return "status-badge-neutral";
}

function ratingLabel(rating: "good" | "needs-improvement" | "poor" | null | undefined): string {
  if (rating === "good") return m.metrics_ratingGood();
  if (rating === "needs-improvement") return m.metrics_ratingNeedsImprovement();
  if (rating === "poor") return m.metrics_ratingPoor();
  return "-";
}

function rangeLabel(range: RangeFilter): string {
  switch (range) {
    case "1h":
      return m.metrics_range1h();
    case "24h":
      return m.metrics_range24h();
    case "7d":
      return m.metrics_range7d();
    case "30d":
      return m.metrics_range30d();
  }
}

function metricDescription(metric: string): string {
  switch (metric) {
    case "LCP":
      return m.metrics_descLcp();
    case "INP":
      return m.metrics_descInp();
    case "CLS":
      return m.metrics_descCls();
    case "FCP":
      return m.metrics_descFcp();
    case "TTFB":
      return m.metrics_descTtfb();
    default:
      return metric;
  }
}

function formatValue(metric: string, value: number): string {
  if (!Number.isFinite(value)) return "-";
  const unit = METRIC_UNITS[metric] ?? "";
  return unit ? `${value.toFixed(0)} ${unit}` : value.toFixed(3);
}

function MetricCard({ summary }: { summary: MetricSummary }) {
  return (
    <div className="panel p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="panel-title">{summary.name}</h3>
        <span className="font-utility text-xs text-foreground-muted">
          {m.metrics_samples({ count: summary.count.toString() })}
        </span>
      </div>
      <p className="mb-3 mt-0.5 text-xs text-foreground-muted">
        {metricDescription(summary.name)}
      </p>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["P50", summary.p50],
          ["P95", summary.p95],
          ["avg", summary.avg],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="panel-label">{label}</div>
            <div className="font-utility text-lg font-semibold text-foreground">
              {formatValue(summary.name, Number(value))}
            </div>
          </div>
        ))}
      </div>

      {summary.count > 0 && (
        <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
          <div
            className="bg-[hsl(var(--color-success))]"
            style={{ width: `${summary.goodPct}%` }}
            title={`${m.metrics_ratingGood()}: ${summary.goodPct}%`}
          />
          <div
            className="bg-[hsl(var(--color-warning))]"
            style={{ width: `${100 - summary.goodPct - summary.poorPct}%` }}
            title={m.metrics_ratingNeedsImprovement()}
          />
          <div
            className="bg-[hsl(var(--color-error))]"
            style={{ width: `${summary.poorPct}%` }}
            title={`${m.metrics_ratingPoor()}: ${summary.poorPct}%`}
          />
        </div>
      )}
    </div>
  );
}

export default function MetricsDashboard() {
  const [range, setRange] = useState<RangeFilter>("7d");
  const [selectedMetric, setSelectedMetric] = useState<string>("LCP");

  const { stats, points, loading, error, refetch } = useMetricsDashboard({ range, selectedMetric });

  return (
    <WorkbenchPageLayout>
      <PageHeader
        kicker={m.metrics_kicker()}
        title={m.metrics_title()}
        description={m.metrics_subtitle()}
        actions={
          <button onClick={refetch} className="btn-secondary h-10 gap-2 px-4">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />{m.common_refresh()}</button>
        }
      />

        <div className="mb-4 flex flex-wrap gap-2">
          {(["1h", "24h", "7d", "30d"] as RangeFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`segmented-option ${range === r ? "segmented-option-active" : ""}`}
            >
              {rangeLabel(r)}
            </button>
          ))}
        </div>

        {error && <StateMessage variant="error" message={error} className="mb-4" />}

        <h2 className="mb-3 text-lg font-semibold text-foreground">{m.metrics_core()}</h2>
        {loading && !stats ? (
          <StateMessage variant="loading" message={m.metrics_loading()} />
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats?.metrics.map((m) => <MetricCard key={m.name} summary={m} />) ??
              CORE_METRICS.map((name) => <MetricCard key={name} summary={{ name, count: 0, p50: 0, p95: 0, avg: 0, goodPct: 0, poorPct: 0 }} />)}
          </div>
        )}

        <div className="table-shell">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
            <h2 className="text-lg font-semibold text-foreground">{m.metrics_recentData()}</h2>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="input w-auto py-1"
            >
              {CORE_METRICS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {points.length === 0 ? (
            <StateMessage variant="empty" title={m.metrics_emptyTitle()} description={m.metrics_emptyDescription()} />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--secondary)/0.72)] text-xs uppercase text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 text-left">{m.metrics_columnTime()}</th>
                  <th className="px-4 py-3 text-left">{m.metrics_columnDevice()}</th>
                  <th className="px-4 py-3 text-left">{m.metrics_columnRating()}</th>
                  <th className="px-4 py-3 text-right">{m.metrics_columnValue()}</th>
                  <th className="px-4 py-3 text-left">URL</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.id} className="data-row">
                    <td className="font-utility px-4 py-3 text-xs text-foreground-muted">
                      {formatShortDateTime(p.recordedAt)}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{p.deviceType ?? "-"}</td>
                    <td className="px-4 py-3">
                      {p.rating ? (
                        <span className={`status-badge ${ratingClass(p.rating)}`}>
                          {ratingLabel(p.rating)}
                        </span>
                      ) : (
                        <span className="text-foreground-muted">-</span>
                      )}
                    </td>
                    <td className="font-utility px-4 py-3 text-right text-foreground">
                      {formatValue(selectedMetric, p.value)}
                    </td>
                    <td className="max-w-md truncate px-4 py-3 text-xs text-foreground-muted">{p.url ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
    </WorkbenchPageLayout>
  );
}
