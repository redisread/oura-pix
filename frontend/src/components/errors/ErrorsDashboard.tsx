/**
 * ErrorsDashboard Component
 *
 * Admin dashboard for browsing and filtering reported errors
 */

"use client";

import { useState, useMemo } from "react";
import { useErrorDashboard, type ErrorRecord } from "@/hooks/useErrorDashboard";

type SeverityFilter = "" | "critical" | "high" | "medium" | "low";
type TypeFilter = "" | "network" | "validation" | "authentication" | "business_logic" | "runtime" | "unknown";
type ModuleFilter = "" | "api" | "frontend" | "worker" | "database";
type RangeFilter = "24h" | "7d" | "30d";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              错误详情
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">{error.hash}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">消息</h3>
            <p className="text-sm text-slate-900 dark:text-slate-100 break-words">{error.message}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">严重程度</div>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[error.severity]}`}>
                {error.severity}
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-500">类型</div>
              <div className="mt-1 text-slate-900 dark:text-slate-100">{error.type}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">模块</div>
              <div className="mt-1 text-slate-900 dark:text-slate-100">{error.module}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">出现次数</div>
              <div className="mt-1 text-slate-900 dark:text-slate-100 font-mono">{error.occurrences}</div>
            </div>
          </div>

          {error.stack && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">堆栈</h3>
              <pre className="text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded overflow-x-auto whitespace-pre-wrap break-all">
                {error.stack}
              </pre>
            </div>
          )}

          {contextObj && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">上下文</h3>
              <pre className="text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded overflow-x-auto">
                {JSON.stringify(contextObj, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">错误追踪</h1>
          <p className="text-sm text-slate-500 mt-1">监控前端和后端错误</p>
        </div>
        <button
          onClick={refetch}
          className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
        >
          刷新
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500">总错误数</div>
            <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-slate-100">{stats.total}</div>
          </div>
          {(["critical", "high", "medium", "low"] as const).map((sev) => (
            <div key={sev} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500">{sev}</div>
              <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-slate-100">
                {stats.bySeverity[sev] ?? 0}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 flex flex-wrap gap-3">
        <select
          value={range}
          onChange={(e) => {
            setRange(e.target.value as RangeFilter);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
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
          className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
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
          className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
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
          className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
        >
          <option value="">所有模块</option>
          <option value="api">api</option>
          <option value="frontend">frontend</option>
          <option value="worker">worker</option>
          <option value="database">database</option>
        </select>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBatchDelete}
            className="ml-auto px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            删除选中 ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Error List */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg mb-4">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {loading && !list ? (
        <div className="text-center py-12 text-slate-500">加载中...</div>
      ) : list && list.data.length === 0 ? (
        <div className="text-center py-12 text-slate-500">暂无错误 🎉</div>
      ) : (
        list && (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === list.data.length && list.data.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left">严重程度</th>
                  <th className="px-4 py-3 text-left">类型</th>
                  <th className="px-4 py-3 text-left">模块</th>
                  <th className="px-4 py-3 text-left">消息</th>
                  <th className="px-4 py-3 text-right">次数</th>
                  <th className="px-4 py-3 text-left">最近</th>
                  <th className="px-4 py-3 text-right w-20">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {list.data.map((err) => (
                  <tr
                    key={err.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                    onClick={() => setSelected(err)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(err.id)}
                        onChange={() => toggleSelect(err.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[err.severity]}`}>
                        {err.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{err.type}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{err.module}</td>
                    <td className="px-4 py-3 max-w-md truncate text-slate-900 dark:text-slate-100">
                      {err.message}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{err.occurrences}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatTime(err.lastSeenAt)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={async () => {
                          if (confirm("确定删除？")) await deleteOne(err.id);
                        }}
                        className="text-slate-400 hover:text-red-500"
                        aria-label="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {list.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm">
                <div className="text-slate-500">
                  第 {list.pagination.page} / {list.pagination.totalPages} 页 · 共 {list.pagination.total} 条
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(list.pagination.totalPages, p + 1))}
                    disabled={page === list.pagination.totalPages}
                    className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50"
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
  );
}
