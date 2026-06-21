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

type RangeFilter = "1h" | "24h" | "7d" | "30d";

const CORE_METRICS = ["LCP", "INP", "CLS", "FCP", "TTFB"] as const;

const METRIC_UNITS: Record<string, string> = {
  LCP: "ms",
  INP: "ms",
  CLS: "",
  FCP: "ms",
  TTFB: "ms",
};

const METRIC_DESCRIPTIONS: Record<string, string> = {
  LCP: "Largest Contentful Paint",
  INP: "Interaction to Next Paint",
  CLS: "Cumulative Layout Shift",
  FCP: "First Contentful Paint",
  TTFB: "Time to First Byte",
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
        <span className="text-xs text-slate-500">{summary.count} samples</span>
      </div>
      <p className="text-xs text-slate-500 mt-0.5 mb-3">{METRIC_DESCRIPTIONS[summary.name]}</p>

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
          <div className="text-xs text-slate-500">avg</div>
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
            title={`Good: ${summary.goodPct}%`}
          />
          <div
            className="bg-yellow-500"
            style={{ width: `${100 - summary.goodPct - summary.poorPct}%` }}
            title="Needs improvement"
          />
          <div className="bg-red-500" style={{ width: `${summary.poorPct}%` }} title={`Poor: ${summary.poorPct}%`} />
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">性能监控</h1>
          <p className="text-sm text-slate-500 mt-1">Web Vitals 和导航时序指标</p>
        </div>
        <button
          onClick={refetch}
          className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
        >
          刷新
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
            {r}
          </button>
        ))}
      </div>

      {error && <StateMessage variant="error" message={error} className="mb-4" />}

      {/* Core Web Vitals cards */}
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3">核心指标</h2>
      {loading && !stats ? (
        <StateMessage variant="loading" message="加载指标..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {stats?.metrics.map((m) => <MetricCard key={m.name} summary={m} />) ??
            CORE_METRICS.map((name) => <MetricCard key={name} summary={{ name, count: 0, p50: 0, p95: 0, avg: 0, goodPct: 0, poorPct: 0 }} />)}
        </div>
      )}

      {/* Recent data points */}
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">最近数据</h2>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
          >
            {CORE_METRICS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {points.length === 0 ? (
          <StateMessage variant="empty" title="暂无数据" description="选择指标后数据将在这里展示" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">时间</th>
                <th className="px-4 py-3 text-left">设备</th>
                <th className="px-4 py-3 text-left">评分</th>
                <th className="px-4 py-3 text-right">值</th>
                <th className="px-4 py-3 text-left">URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {points.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(p.recordedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.deviceType ?? "-"}</td>
                  <td className="px-4 py-3">
                    {p.rating ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ratingBg(p.rating)} ${ratingColor(p.rating)}`}>
                        {p.rating}
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
