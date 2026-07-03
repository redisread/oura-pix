/**
 * ApiKeySettings Component (P1 #93 T5)
 *
 * API Keys management: create (with permissions), list, usage stats, revoke.
 */

"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Eye, EyeOff, Key, Loader2, Plus, Trash2, X } from "lucide-react";
import { useApiKeys, type ApiKey } from "@/hooks/useApiKeys";
import { api } from "@/lib/api";
import { useToast } from "../ui/Toast";
import { SettingSection, SettingField, SettingModal, ConfirmModal } from "./ui";
import { ErrorBanner } from "@/components/ui";
import { StateMessage } from "@/components/StateMessage";
import { formatShortDate } from "@/lib/locale";
import * as m from "@/paraglide/messages.js";

interface UsagePoint {
  date: string;
  count: number;
}

function SimpleBarChart({ data }: { data: UsagePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-foreground-muted text-center py-6">{m.apiKeys_noUsageData()}</div>
    );
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 600;
  const H = 80;
  const barW = Math.max(2, Math.floor(W / data.length) - 1);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H + 20}`}
        className="w-full h-24"
        role="img"
        aria-label={m.apiKeys_usageChartAria()}
      >
        {data.map((d, i) => {
          const h = Math.max(2, Math.round((d.count / max) * H));
          const x = i * (barW + 1);
          const y = H - h;
          return (
            <rect
              key={d.date}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={1}
              fill="hsl(var(--primary))"
              opacity={d.count > 0 ? 0.85 : 0.2}
            >
              <title>{`${d.date}: ${m.apiKeys_usageCount({ count: d.count })}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-foreground-muted mt-1">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

export default function ApiKeySettings() {
  const { keys, loading, error, newlyCreated, setNewlyCreated, createKey, revokeKey } = useApiKeys();
  const toast = useToast();
  const [usage, setUsage] = useState<UsagePoint[]>([]);
  const [usageLoading, setUsageLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showRevoke, setShowRevoke] = useState<ApiKey | null>(null);
  const [showKey, setShowKey] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPermissions, setNewPermissions] = useState<"read" | "read-write">("read-write");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadUsage() {
      try {
        const res = await api.get("/api/v1/api-keys/usage?days=30");
        if (!cancelled && res.data?.success && Array.isArray(res.data.data)) {
          setUsage(res.data.data);
        }
      } catch {
        // silently ignore - usage may not be implemented
      } finally {
        if (!cancelled) setUsageLoading(false);
      }
    }
    loadUsage();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async () => {
    if (newName.trim().length === 0) {
      toast.error(m.apiKeys_nameRequired());
      return;
    }
    setSubmitting(true);
    try {
      const result = await createKey(newName.trim(), 365);
      if (result) {
        setShowCreate(false);
        setNewName("");
        setNewPermissions("read-write");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!showRevoke) return;
    setSubmitting(true);
    try {
      await revokeKey(showRevoke.id);
      setShowRevoke(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingSection
        title={m.apiKeys_sectionTitle()}
        description={m.apiKeys_sectionDescription()}
        icon={<Key className="h-5 w-5" />}
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="btn-primary px-4 py-2 inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {m.apiKeys_createButton()}
          </button>
        }
      />

      {/* Newly Created Key Banner */}
      {newlyCreated && (
        <div className="card p-4 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {m.apiKeys_createdKicker()}
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {m.apiKeys_newlyCreatedWarning()}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded bg-[hsl(var(--background))] border border-amber-200 dark:border-amber-900 text-xs font-mono break-all">
                  {showKey ? newlyCreated.key : "••••••••••••••••"}
                </code>
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="p-2 text-foreground-muted"
                  aria-label={showKey ? m.apiKeys_hideKey() : m.apiKeys_showKey()}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNewlyCreated(null)}
              className="text-foreground-muted shrink-0"
              aria-label={m.common_close()}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Usage Chart */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-4 w-4 text-[hsl(var(--primary))]" />
          <span className="text-sm font-semibold text-foreground">{m.apiKeys_usageHeading()}</span>
        </div>
        {usageLoading ? (
          <StateMessage variant="loading" />
        ) : (
          <SimpleBarChart data={usage} />
        )}
      </div>

      {error && <ErrorBanner message={error} className="mb-2" />}

      {/* Key List */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="h-4 w-4 text-[hsl(var(--primary))]" />
          <span className="text-sm font-semibold text-foreground">{m.apiKeys_allKeys()}</span>
        </div>

        {loading ? (
          <StateMessage variant="loading" />
        ) : keys.length === 0 ? (
          <StateMessage variant="empty" title={m.apiKeys_emptyTitle()} description={m.apiKeys_emptyDescription()} />
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border border-[hsl(var(--border))]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{k.name}</span>
                    {k.permissions === "read" && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-foreground-muted">{m.apiKeys_permRead()}</span>
                    )}
                    {k.permissions === "read-write" && (
                      <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">{m.apiKeys_permReadWrite()}</span>
                    )}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    {m.apiKeys_createdLabel()}{formatShortDate(k.createdAt)}
                    {k.lastUsedAt && (
                      <>
                        {" · "}
                        {m.apiKeys_lastUsedLabel()}
                        {formatShortDate(k.lastUsedAt!)}
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevoke(k)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                  aria-label={m.apiKeys_revokeAria()}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <SettingModal open={showCreate} onClose={() => !submitting && setShowCreate(false)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">{m.apiKeys_createModalTitle()}</h3>
          <button type="button" onClick={() => setShowCreate(false)} className="text-foreground-muted" aria-label={m.common_close()}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <SettingField label={m.apiKeys_nameLabel()}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={m.apiKeys_namePlaceholder()}
              className="input"
            />
          </SettingField>
          <SettingField label={m.apiKeys_permissionsLabel()}>
            <select
              value={newPermissions}
              onChange={(e) => setNewPermissions(e.target.value as "read" | "read-write")}
              className="input"
            >
              <option value="read">{m.apiKeys_permReadOpt()}</option>
              <option value="read-write">{m.apiKeys_permReadWriteOpt()}</option>
            </select>
          </SettingField>
          <div className="text-xs text-foreground-muted bg-[hsl(var(--secondary))] p-3 rounded">
            {m.apiKeys_createWarning()}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => setShowCreate(false)}
            disabled={submitting}
            className="btn-secondary px-4 py-2"
          >{m.common_cancel()}</button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={submitting}
            className="btn-primary px-4 py-2 inline-flex items-center gap-2"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {m.apiKeys_create()}
          </button>
        </div>
      </SettingModal>

      {/* Revoke Confirmation Modal */}
      <ConfirmModal
        open={Boolean(showRevoke)}
        onClose={() => !submitting && setShowRevoke(null)}
        onConfirm={handleRevoke}
        title={m.apiKeys_revokeTitle()}
        description={
          showRevoke
            ? m.apiKeys_revokeConfirmTemplate({ name: showRevoke.name })
            : ""
        }
        confirmLabel={m.apiKeys_revoke()}
        loading={submitting}
        icon={<AlertTriangle className="h-5 w-5" />}
      />
    </div>
  );
}
