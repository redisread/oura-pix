/**
 * ErrorsDashboard Component
 *
 * Admin dashboard for browsing and filtering reported errors
 */

"use client";

import { useState, useMemo } from "react";
import { useErrorDashboard, type ErrorRecord } from "@/hooks/useErrorDashboard";
import { formatLocaleDateTime } from "@/lib/locale";
import * as m from "@/paraglide/messages.js";

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
  return formatLocaleDateTime(dateString, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSeverityLabel(severity: string): string {
  switch (severity) {
    case "critical":
      return m.errors_severityCritical();
    case "high":
      return m.errors_severityHigh();
    case "medium":
      return m.errors_severityMedium();
    case "low":
      return m.errors_severityLow();
    default:
      return severity;
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "network":
      return m.errors_typeNetwork();
    case "validation":
      return m.errors_typeValidation();
    case "authentication":
      return m.errors_typeAuthentication();
    case "business_logic":
      return m.errors_typeBusinessLogic();
    case "runtime":
      return m.errors_typeRuntime();
    case "unknown":
      return m.errors_typeUnknown();
    default:
      return type;
  }
}

function getModuleLabel(module: string): string {
  switch (module) {
    case "api":
      return m.errors_moduleApi();
    case "frontend":
      return m.errors_moduleFrontend();
    case "worker":
      return m.errors_moduleWorker();
    case "database":
      return m.errors_moduleDatabase();
    default:
      return module;
  }
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
              {m.errors_detailTitle()}
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-mono">{error.hash}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={m.common_close()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{m.errors_message()}</h3>
            <p className="text-sm text-slate-900 dark:text-slate-100 break-words">{error.message}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">{m.errors_severity()}</div>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_COLORS[error.severity]}`}>
                {getSeverityLabel(error.severity)}
              </span>
            </div>
            <div>
              <div className="text-xs text-slate-500">{m.errors_type()}</div>
              <div className="mt-1 text-slate-900 dark:text-slate-100">{getTypeLabel(error.type)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">{m.errors_module()}</div>
              <div className="mt-1 text-slate-900 dark:text-slate-100">{getModuleLabel(error.module)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">{m.errors_occurrences()}</div>
              <div className="mt-1 text-slate-900 dark:text-slate-100 font-mono">{error.occurrences}</div>
            </div>
          </div>

          {error.stack && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{m.errors_stack()}</h3>
              <pre className="text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded overflow-x-auto whitespace-pre-wrap break-all">
                {error.stack}
              </pre>
            </div>
          )}

          {contextObj && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{m.errors_context()}</h3>
              <pre className="text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded overflow-x-auto">
                {JSON.stringify(contextObj, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-700">
            <div>{m.errors_firstSeen({ time: formatTime(error.createdAt) })}</div>
            <div>{m.errors_lastSeen({ time: formatTime(error.lastSeenAt) })}</div>
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
    if (!confirm(m.errors_deleteSelectedConfirm({ count: selectedIds.size.toString() }))) return;
    await deleteMany(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{m.errors_title()}</h1>
          <p className="text-sm text-slate-500 mt-1">{m.errors_subtitle()}</p>
        </div>
        <button
          onClick={refetch}
          className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
        >
          {m.common_refresh()}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500">{m.errors_total()}</div>
            <div className="text-2xl font-semibold mt-1 text-slate-900 dark:text-slate-100">{stats.total}</div>
          </div>
          {(["critical", "high", "medium", "low"] as const).map((sev) => (
            <div key={sev} className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500">{getSeverityLabel(sev)}</div>
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
          <option value="24h">{m.errors_range24h()}</option>
          <option value="7d">{m.errors_range7d()}</option>
          <option value="30d">{m.errors_range30d()}</option>
        </select>
        <select
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value as SeverityFilter);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
        >
          <option value="">{m.errors_allSeverities()}</option>
          <option value="critical">{m.errors_severityCritical()}</option>
          <option value="high">{m.errors_severityHigh()}</option>
          <option value="medium">{m.errors_severityMedium()}</option>
          <option value="low">{m.errors_severityLow()}</option>
        </select>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as TypeFilter);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
        >
          <option value="">{m.errors_allTypes()}</option>
          <option value="network">{m.errors_typeNetwork()}</option>
          <option value="validation">{m.errors_typeValidation()}</option>
          <option value="authentication">{m.errors_typeAuthentication()}</option>
          <option value="business_logic">{m.errors_typeBusinessLogic()}</option>
          <option value="runtime">{m.errors_typeRuntime()}</option>
          <option value="unknown">{m.errors_typeUnknown()}</option>
        </select>
        <select
          value={module}
          onChange={(e) => {
            setModule(e.target.value as ModuleFilter);
            setPage(1);
          }}
          className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
        >
          <option value="">{m.errors_allModules()}</option>
          <option value="api">{m.errors_moduleApi()}</option>
          <option value="frontend">{m.errors_moduleFrontend()}</option>
          <option value="worker">{m.errors_moduleWorker()}</option>
          <option value="database">{m.errors_moduleDatabase()}</option>
        </select>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBatchDelete}
            className="ml-auto px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
          >
            {m.errors_deleteSelected({ count: selectedIds.size.toString() })}
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
        <div className="text-center py-12 text-slate-500">{m.errors_loading()}</div>
      ) : list && list.data.length === 0 ? (
        <div className="text-center py-12 text-slate-500">{m.errors_empty()}</div>
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
                  <th className="px-4 py-3 text-left">{m.errors_severity()}</th>
                  <th className="px-4 py-3 text-left">{m.errors_type()}</th>
                  <th className="px-4 py-3 text-left">{m.errors_module()}</th>
                  <th className="px-4 py-3 text-left">{m.errors_message()}</th>
                  <th className="px-4 py-3 text-right">{m.errors_occurrences()}</th>
                  <th className="px-4 py-3 text-left">{m.errors_recent()}</th>
                  <th className="px-4 py-3 text-right w-20">{m.common_actions()}</th>
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
                        {getSeverityLabel(err.severity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{getTypeLabel(err.type)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{getModuleLabel(err.module)}</td>
                    <td className="px-4 py-3 max-w-md truncate text-slate-900 dark:text-slate-100">
                      {err.message}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{err.occurrences}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{formatTime(err.lastSeenAt)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={async () => {
                          if (confirm(m.errors_deleteConfirm())) await deleteOne(err.id);
                        }}
                        className="text-slate-400 hover:text-red-500"
                        aria-label={m.common_delete()}
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
                  {m.errors_pagination({
                    page: list.pagination.page.toString(),
                    totalPages: list.pagination.totalPages.toString(),
                    total: list.pagination.total.toString(),
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50"
                  >
                    {m.common_previousPage()}
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(list.pagination.totalPages, p + 1))}
                    disabled={page === list.pagination.totalPages}
                    className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50"
                  >
                    {m.common_nextPage()}
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
