/**
 * MetricsDashboard Component
 *
 * Displays Web Vitals aggregates (P50/P95/avg + good/poor distribution)
 * and a recent-points table.
 */

"use client";

import { useState } from "react";
import { useMetricsDashboard, type MetricSummary } from "@/hooks/useMetricsDashboard";
import { StateMessage } from "@/components/StateMessage";
import { formatLocaleDateTime } from "@/lib/locale";
import * as m from "@/paraglide/messages.js";

type RangeFilter = "1h" | "24h" | "7d" | "30d";

const CORE_METRICS = ["LCP", "INP", "CLS", "FCP", "TTFB"] as const;

const METRIC_UNITS: Record<string, string> = {
  LCP: "ms",
  INP: "ms",
  CLS: "",
  FCP: "ms",
  TTFB: "ms",
};

function ratingColor(rating: "good" | "needs-improvement" | "poor" | null | undefined): string {
  if (rating === "good") return "text-green-600 dark:text-green-400";
  if (rating === "needs-improvement") return "text-yellow-600 dark:text-yellow-400";
  if (rating === "poor") return "text-red-600 dark:text-red-400";
  return "text-slate-400";
}

function ratingBg(rating: "good" | "needs-improvement" | "poor" | null | undefined): string {
  if (rating === "good") return "bg-green-100 dark:bg-green-900/30";
  if (rating === "needs-improvement") return "bg-yellow-100 dark:bg-yellow-900/30";
  if (rating === "poor") return "bg-red-100 dark:bg-red-900/30";
  return "bg-slate-100 dark:bg-slate-800";
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
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{summary.name}</h3>
        <span className="text-xs text-slate-500">{m.metrics_samples({ count: summary.count.toString() })}</span>
      </div>
      <p className="text-xs text-slate-500 mt-0.5 mb-3">{metricDescription(summary.name)}</p>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-slate-500">P50</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatValue(summary.name, summary.p50)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">P95</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatValue(summary.name, summary.p95)}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500">{m.metrics_average()}</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatValue(summary.name, summary.avg)}
          </div>
        </div>
      </div>

      {summary.count > 0 && (
        <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex">
          <div
            className="bg-green-500"
            style={{ width: `${summary.goodPct}%` }}
            title={`${m.metrics_ratingGood()}: ${summary.goodPct}%`}
          />
          <div
            className="bg-yellow-500"
            style={{ width: `${100 - summary.goodPct - summary.poorPct}%` }}
            title={m.metrics_ratingNeedsImprovement()}
          />
          <div className="bg-red-500" style={{ width: `${summary.poorPct}%` }} title={`${m.metrics_ratingPoor()}: ${summary.poorPct}%`} />
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{m.metrics_title()}</h1>
          <p className="text-sm text-slate-500 mt-1">{m.metrics_subtitle()}</p>
        </div>
        <button
          onClick={refetch}
          className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
        >
          {m.common_refresh()}
        </button>
      </div>

      {/* Range selector */}
      <div className="flex gap-2 mb-4">
        {(["1h", "24h", "7d", "30d"] as RangeFilter[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 text-sm rounded ${
              range === r
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {rangeLabel(r)}
          </button>
        ))}
      </div>

      {error && <StateMessage variant="error" message={error} className="mb-4" />}

      {/* Core Web Vitals cards */}
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">{m.metrics_core()}</h2>
      {loading && !stats ? (
        <StateMessage variant="loading" message={m.metrics_loading()} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {stats?.metrics.map((metric) => <MetricCard key={metric.name} summary={metric} />) ??
            CORE_METRICS.map((name) => <MetricCard key={name} summary={{ name, count: 0, p50: 0, p95: 0, avg: 0, goodPct: 0, poorPct: 0 }} />)}
        </div>
      )}

      {/* Recent data points */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{m.metrics_recentData()}</h2>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
          >
            {CORE_METRICS.map((metric) => (
              <option key={metric} value={metric}>
                {metric}
              </option>
            ))}
          </select>
        </div>

        {points.length === 0 ? (
          <StateMessage variant="empty" title={m.metrics_emptyTitle()} description={m.metrics_emptyDescription()} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">{m.metrics_columnTime()}</th>
                <th className="px-4 py-3 text-left">{m.metrics_columnDevice()}</th>
                <th className="px-4 py-3 text-left">{m.metrics_columnRating()}</th>
                <th className="px-4 py-3 text-right">{m.metrics_columnValue()}</th>
                <th className="px-4 py-3 text-left">URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {points.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {formatLocaleDateTime(p.recordedAt, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.deviceType ?? "-"}</td>
                  <td className="px-4 py-3">
                    {p.rating ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ratingBg(p.rating)} ${ratingColor(p.rating)}`}>
                        {ratingLabel(p.rating)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${ratingColor(p.rating)}`}>
                    {formatValue(selectedMetric, p.value)}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-md truncate">{p.url ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
