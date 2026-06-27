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

function ratingClass(rating: "good" | "needs-improvement" | "poor" | null | undefined): string {
  if (rating === "good") return "status-badge-success";
  if (rating === "needs-improvement") return "status-badge-warning";
  if (rating === "poor") return "status-badge-error";
  return "status-badge-neutral";
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
        <span className="font-utility text-xs text-foreground-muted">{summary.count} samples</span>
      </div>
      <p className="mb-3 mt-0.5 text-xs text-foreground-muted">{METRIC_DESCRIPTIONS[summary.name]}</p>

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
            title={`Good: ${summary.goodPct}%`}
          />
          <div
            className="bg-[hsl(var(--color-warning))]"
            style={{ width: `${100 - summary.goodPct - summary.poorPct}%` }}
            title="Needs improvement"
          />
          <div className="bg-[hsl(var(--color-error))]" style={{ width: `${summary.poorPct}%` }} title={`Poor: ${summary.poorPct}%`} />
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
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">Operations / Web vitals</p>
            <h1 className="page-title mt-2">性能监控</h1>
            <p className="page-description mt-3">Web Vitals 和导航时序指标</p>
          </div>
          <button onClick={refetch} className="btn-secondary h-10 gap-2 px-4">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            刷新
          </button>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["1h", "24h", "7d", "30d"] as RangeFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`segmented-option ${range === r ? "segmented-option-active" : ""}`}
            >
              {r}
            </button>
          ))}
        </div>

        {error && <StateMessage variant="error" message={error} className="mb-4" />}

        <h2 className="mb-3 text-lg font-semibold text-foreground">核心指标</h2>
        {loading && !stats ? (
          <StateMessage variant="loading" message="加载指标..." />
        ) : (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {stats?.metrics.map((m) => <MetricCard key={m.name} summary={m} />) ??
              CORE_METRICS.map((name) => <MetricCard key={name} summary={{ name, count: 0, p50: 0, p95: 0, avg: 0, goodPct: 0, poorPct: 0 }} />)}
          </div>
        )}

        <div className="table-shell">
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
            <h2 className="text-lg font-semibold text-foreground">最近数据</h2>
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
            <StateMessage variant="empty" title="暂无数据" description="选择指标后数据将在这里展示" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--secondary)/0.72)] text-xs uppercase text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 text-left">时间</th>
                  <th className="px-4 py-3 text-left">设备</th>
                  <th className="px-4 py-3 text-left">评分</th>
                  <th className="px-4 py-3 text-right">值</th>
                  <th className="px-4 py-3 text-left">URL</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.id} className="data-row">
                    <td className="font-utility px-4 py-3 text-xs text-foreground-muted">
                      {new Date(p.recordedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 text-foreground-muted">{p.deviceType ?? "-"}</td>
                    <td className="px-4 py-3">
                      {p.rating ? (
                        <span className={`status-badge ${ratingClass(p.rating)}`}>{p.rating}</span>
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
      </div>
    </div>
  );
}
