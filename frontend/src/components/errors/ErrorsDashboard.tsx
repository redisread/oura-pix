/**
 * ErrorsDashboard Component
 *
 * Admin dashboard for browsing and filtering reported errors
 */

"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Trash2, X } from "lucide-react";
import { useErrorDashboard, type ErrorRecord } from "@/hooks/useErrorDashboard";
import { StateMessage } from "@/components/StateMessage";

type SeverityFilter = "" | "critical" | "high" | "medium" | "low";
type TypeFilter = "" | "network" | "validation" | "authentication" | "business_logic" | "runtime" | "unknown";
type ModuleFilter = "" | "api" | "frontend" | "worker" | "database";
type RangeFilter = "24h" | "7d" | "30d";

const SEVERITY_BADGES: Record<string, string> = {
  critical: "status-badge-error",
  high: "status-badge-error",
  medium: "status-badge-warning",
  low: "status-badge-neutral",
};

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ErrorDetailPanel({
  error,
  onClose,
}: {
  error: ErrorRecord;
  onClose: () => void;
}) {
  const contextObj = useMemo(() => {
    if (!error.context) return null;
    try {
      return JSON.parse(error.context) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [error.context]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground)/0.42)] p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="panel max-h-[80vh] w-full max-w-3xl overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[hsl(var(--border))] p-6">
          <div>
            <p className="page-kicker">Error detail</p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-foreground">错误详情</h2>
            <p className="font-utility mt-1 text-xs text-foreground-muted">{error.hash}</p>
          </div>
          <button onClick={onClose} className="icon-button h-9 w-9" aria-label="Close">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <h3 className="panel-label mb-2">消息</h3>
            <p className="break-words text-sm text-foreground">{error.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <div className="panel-label">严重程度</div>
              <span className={`status-badge mt-1 ${SEVERITY_BADGES[error.severity]}`}>{error.severity}</span>
            </div>
            <div>
              <div className="panel-label">类型</div>
              <div className="mt-1 text-foreground">{error.type}</div>
            </div>
            <div>
              <div className="panel-label">模块</div>
              <div className="mt-1 text-foreground">{error.module}</div>
            </div>
            <div>
              <div className="panel-label">出现次数</div>
              <div className="font-utility mt-1 text-foreground">{error.occurrences}</div>
            </div>
          </div>

          {error.stack && (
            <div>
              <h3 className="panel-label mb-2">堆栈</h3>
              <pre className="panel-muted font-utility overflow-x-auto whitespace-pre-wrap break-all p-3 text-xs">
                {error.stack}
              </pre>
            </div>
          )}

          {contextObj && (
            <div>
              <h3 className="panel-label mb-2">上下文</h3>
              <pre className="panel-muted font-utility overflow-x-auto p-3 text-xs">
                {JSON.stringify(contextObj, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-[hsl(var(--border))] pt-2 text-xs text-foreground-muted">
            <div>首次出现: {formatTime(error.createdAt)}</div>
            <div>最近出现: {formatTime(error.lastSeenAt)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ErrorsDashboard() {
  const [range, setRange] = useState<RangeFilter>("7d");
  const [severity, setSeverity] = useState<SeverityFilter>("");
  const [type, setType] = useState<TypeFilter>("");
  const [module, setModule] = useState<ModuleFilter>("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ErrorRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { list, stats, loading, error, refetch, deleteOne, deleteMany } = useErrorDashboard({
    range,
    severity: severity || undefined,
    type: type || undefined,
    module: module || undefined,
    page,
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!list) return;
    const allIds = list.data.map((e) => e.id);
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定删除 ${selectedIds.size} 条错误？`)) return;
    await deleteMany(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">Operations / Errors</p>
            <h1 className="page-title mt-2">错误追踪</h1>
            <p className="page-description mt-3">监控前端和后端错误</p>
          </div>
          <button onClick={refetch} className="btn-secondary h-10 gap-2 px-4">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            刷新
          </button>
        </header>

        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="panel p-4">
              <div className="panel-label">总错误数</div>
              <div className="font-utility mt-1 text-2xl font-semibold text-foreground">{stats.total}</div>
            </div>
            {(["critical", "high", "medium", "low"] as const).map((sev) => (
              <div key={sev} className="panel p-4">
                <div className="panel-label">{sev}</div>
                <div className="font-utility mt-1 text-2xl font-semibold text-foreground">
                  {stats.bySeverity[sev] ?? 0}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="panel mb-4 flex flex-wrap gap-3 p-4">
          <select
            value={range}
            onChange={(e) => {
              setRange(e.target.value as RangeFilter);
              setPage(1);
            }}
            className="input w-auto py-1.5"
          >
            <option value="24h">最近 24 小时</option>
            <option value="7d">最近 7 天</option>
            <option value="30d">最近 30 天</option>
          </select>
          <select
            value={severity}
            onChange={(e) => {
              setSeverity(e.target.value as SeverityFilter);
              setPage(1);
            }}
            className="input w-auto py-1.5"
          >
            <option value="">所有严重程度</option>
            <option value="critical">critical</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as TypeFilter);
              setPage(1);
            }}
            className="input w-auto py-1.5"
          >
            <option value="">所有类型</option>
            <option value="network">network</option>
            <option value="validation">validation</option>
            <option value="authentication">authentication</option>
            <option value="business_logic">business_logic</option>
            <option value="runtime">runtime</option>
            <option value="unknown">unknown</option>
          </select>
          <select
            value={module}
            onChange={(e) => {
              setModule(e.target.value as ModuleFilter);
              setPage(1);
            }}
            className="input w-auto py-1.5"
          >
            <option value="">所有模块</option>
            <option value="api">api</option>
            <option value="frontend">frontend</option>
            <option value="worker">worker</option>
            <option value="database">database</option>
          </select>
          {selectedIds.size > 0 && (
            <button onClick={handleBatchDelete} className="btn-primary ml-auto h-10 gap-2 bg-[hsl(var(--color-error))] px-3 hover:bg-[hsl(var(--color-error))]">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              删除选中 ({selectedIds.size})
            </button>
          )}
        </div>

        {error && (
          <div className="error-banner mb-4">
            <p>{error}</p>
          </div>
        )}

        {loading && !list ? (
          <StateMessage variant="loading" message="加载错误..." />
        ) : list && list.data.length === 0 ? (
          <StateMessage variant="empty" title="暂无错误" description="当前筛选条件下没有错误记录" />
        ) : (
          list && (
            <div className="table-shell">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(var(--secondary)/0.72)] text-xs uppercase text-foreground-muted">
                  <tr>
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === list.data.length && list.data.length > 0}
                        onChange={toggleSelectAll}
                        aria-label="选择全部错误"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">严重程度</th>
                    <th className="px-4 py-3 text-left">类型</th>
                    <th className="px-4 py-3 text-left">模块</th>
                    <th className="px-4 py-3 text-left">消息</th>
                    <th className="px-4 py-3 text-right">次数</th>
                    <th className="px-4 py-3 text-left">最近</th>
                    <th className="w-20 px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.map((err) => (
                    <tr key={err.id} className="data-row cursor-pointer" onClick={() => setSelected(err)}>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(err.id)}
                          onChange={() => toggleSelect(err.id)}
                          aria-label="选择错误"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${SEVERITY_BADGES[err.severity]}`}>{err.severity}</span>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">{err.type}</td>
                      <td className="px-4 py-3 text-foreground-muted">{err.module}</td>
                      <td className="max-w-md truncate px-4 py-3 text-foreground">{err.message}</td>
                      <td className="font-utility px-4 py-3 text-right">{err.occurrences}</td>
                      <td className="font-utility px-4 py-3 text-xs text-foreground-muted">{formatTime(err.lastSeenAt)}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={async () => {
                            if (confirm("确定删除？")) await deleteOne(err.id);
                          }}
                          className="icon-button h-8 w-8 hover:text-[hsl(var(--color-error))]"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {list.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-4 py-3 text-sm">
                  <div className="text-foreground-muted">
                    第 {list.pagination.page} / {list.pagination.totalPages} 页 · 共 {list.pagination.total} 条
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-secondary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      上一页
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(list.pagination.totalPages, p + 1))}
                      disabled={page === list.pagination.totalPages}
                      className="btn-secondary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {selected && <ErrorDetailPanel error={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
}
