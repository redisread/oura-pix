/**
 * ErrorsDashboard Component
 *
 * Admin dashboard for browsing and filtering reported errors
 */

"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui";
import { useErrorDashboard, type ErrorRecord } from "@/hooks/useErrorDashboard";
import { StateMessage } from "@/components/StateMessage";
import { formatLocaleDateTime } from "@/lib/locale";
import * as m from "@/paraglide/messages.js";

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
    <Modal open onClose={onClose} size="xl" overlay="fg-42" contentClassName="!p-0 !max-w-3xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-[hsl(var(--border))] p-6">
          <div>
            <p className="page-kicker">{m.errors_detailKicker()}</p>
            <h2 className="font-display mt-1 text-2xl font-semibold text-foreground">{m.errors_detailTitle()}</h2>
            <p className="font-utility mt-1 text-xs text-foreground-muted">{error.hash}</p>
          </div>
          <button onClick={onClose} className="icon-button h-9 w-9" aria-label={m.common_close()}>
            <span className="text-lg leading-none" aria-hidden="true">&#x2715;</span>
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <h3 className="panel-label mb-2">{m.errors_message()}</h3>
            <p className="break-words text-sm text-foreground">{error.message}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <div className="panel-label">{m.errors_severity()}</div>
              <span className={`status-badge mt-1 ${SEVERITY_BADGES[error.severity]}`}>
                {getSeverityLabel(error.severity)}
              </span>
            </div>
            <div>
              <div className="panel-label">{m.errors_type()}</div>
              <div className="mt-1 text-foreground">{getTypeLabel(error.type)}</div>
            </div>
            <div>
              <div className="panel-label">{m.errors_module()}</div>
              <div className="mt-1 text-foreground">{getModuleLabel(error.module)}</div>
            </div>
            <div>
              <div className="panel-label">{m.errors_occurrences()}</div>
              <div className="font-utility mt-1 text-foreground">{error.occurrences}</div>
            </div>
          </div>

          {error.stack && (
            <div>
              <h3 className="panel-label mb-2">{m.errors_stack()}</h3>
              <pre className="panel-muted font-utility overflow-x-auto whitespace-pre-wrap break-all p-3 text-xs">
                {error.stack}
              </pre>
            </div>
          )}

          {contextObj && (
            <div>
              <h3 className="panel-label mb-2">{m.errors_context()}</h3>
              <pre className="panel-muted font-utility overflow-x-auto p-3 text-xs">
                {JSON.stringify(contextObj, null, 2)}
              </pre>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t border-[hsl(var(--border))] pt-2 text-xs text-foreground-muted">
            <div>{m.errors_firstSeenShort({ time: formatTime(error.createdAt) })}</div>
            <div>{m.errors_lastSeenShort({ time: formatTime(error.lastSeenAt) })}</div>
          </div>
        </div>
    </Modal>
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
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">{m.errors_operationsKicker()}</p>
            <h1 className="page-title mt-2">{m.errors_title()}</h1>
            <p className="page-description mt-3">{m.errors_subtitle()}</p>
          </div>
          <button onClick={refetch} className="btn-secondary h-10 gap-2 px-4">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />{m.common_refresh()}</button>
        </header>

        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="panel p-4">
              <div className="panel-label">{m.errors_total()}</div>
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
            className="input w-auto py-1.5"
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
            className="input w-auto py-1.5"
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
            className="input w-auto py-1.5"
          >
            <option value="">{m.errors_allModules()}</option>
            <option value="api">{m.errors_moduleApi()}</option>
            <option value="frontend">{m.errors_moduleFrontend()}</option>
            <option value="worker">{m.errors_moduleWorker()}</option>
            <option value="database">{m.errors_moduleDatabase()}</option>
          </select>
          {selectedIds.size > 0 && (
            <button onClick={handleBatchDelete} className="btn-primary ml-auto h-10 gap-2 bg-[hsl(var(--color-error))] px-3 hover:bg-[hsl(var(--color-error))]">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {m.errors_deleteSelected({ count: selectedIds.size.toString() })}
            </button>
          )}
        </div>

        {error && (
          <div className="error-banner mb-4">
            <p>{error}</p>
          </div>
        )}

        {loading && !list ? (
          <StateMessage variant="loading" message={m.errors_loadingRecords()} />
        ) : list && list.data.length === 0 ? (
          <StateMessage variant="empty" title={m.errors_emptyTitle()} description={m.errors_emptyDescription()} />
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
                        aria-label={m.errors_selectAllAria()}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">{m.errors_severity()}</th>
                    <th className="px-4 py-3 text-left">{m.errors_type()}</th>
                    <th className="px-4 py-3 text-left">{m.errors_module()}</th>
                    <th className="px-4 py-3 text-left">{m.errors_message()}</th>
                    <th className="px-4 py-3 text-right">{m.errors_countShort()}</th>
                    <th className="px-4 py-3 text-left">{m.errors_recent()}</th>
                    <th className="w-20 px-4 py-3 text-right">{m.common_actions()}</th>
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
                          aria-label={m.errors_selectAria()}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${SEVERITY_BADGES[err.severity]}`}>
                          {getSeverityLabel(err.severity)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">{getTypeLabel(err.type)}</td>
                      <td className="px-4 py-3 text-foreground-muted">{getModuleLabel(err.module)}</td>
                      <td className="max-w-md truncate px-4 py-3 text-foreground">{err.message}</td>
                      <td className="font-utility px-4 py-3 text-right">{err.occurrences}</td>
                      <td className="font-utility px-4 py-3 text-xs text-foreground-muted">{formatTime(err.lastSeenAt)}</td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={async () => {
                            if (confirm(m.errors_deleteConfirm())) await deleteOne(err.id);
                          }}
                          className="icon-button h-8 w-8 hover:text-[hsl(var(--color-error))]"
                          aria-label={m.common_delete()}
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
                    {m.errors_pagination({ page: list.pagination.page.toString(), totalPages: list.pagination.totalPages.toString(), total: list.pagination.total.toString() })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-secondary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >{m.common_previousPage()}</button>
                    <button
                      onClick={() => setPage((p) => Math.min(list.pagination.totalPages, p + 1))}
                      disabled={page === list.pagination.totalPages}
                      className="btn-secondary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >{m.common_nextPage()}</button>
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
