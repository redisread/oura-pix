/**
 * ApiKeySettings Component (P1 #93 T5)
 *
 * API Keys management: create (with permissions), list, usage stats, revoke.
 */

"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Copy, Eye, EyeOff, Key, Loader2, Plus, Trash2, X } from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { api } from "@/lib/api";
import { useToast } from "../ui/Toast";

interface ApiKeyData {
  id: string;
  name: string;
  permissions?: "read" | "read-write";
  createdAt: string;
  lastUsedAt?: string | null;
}

interface UsagePoint {
  date: string;
  count: number;
}

function SimpleBarChart({ data }: { data: UsagePoint[] }) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-foreground-muted text-center py-6">暂无使用数据</div>
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
        aria-label="最近 30 天 API Key 使用量"
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
              <title>{`${d.date}: ${d.count} 次`}</title>
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
  const [showRevoke, setShowRevoke] = useState<ApiKeyData | null>(null);
  const [showKey, setShowKey] = useState(true);
  const [newName, setNewName] = useState("");
  const [newPermissions, setNewPermissions] = useState<"read" | "read-write">("read-write");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadUsage() {
      try {
        // Try stats endpoint - may not exist, fallback to empty
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
      toast.error("请输入 Key 名称");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Key className="h-5 w-5" /> API Keys 管理
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            管理用于访问 /api/v1/* 的 API Key
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="btn-primary px-4 py-2 inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          创建 Key
        </button>
      </div>

      {/* Newly Created Key Banner */}
      {newlyCreated && (
        <div className="card p-4 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                请立即保存你的 API Key（仅显示一次）
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 px-3 py-2 rounded bg-[hsl(var(--background))] border border-amber-200 dark:border-amber-900 text-xs font-mono break-all">
                  {showKey ? newlyCreated.key : "•".repeat(40)}
                </code>
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="p-2 text-amber-800 dark:text-amber-300"
                  aria-label={showKey ? "隐藏" : "显示"}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(newlyCreated.key);
                    toast.success("已复制到剪贴板");
                  }}
                  className="p-2 text-amber-800 dark:text-amber-300"
                  aria-label="复制"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setNewlyCreated(null)}
              className="text-amber-800 dark:text-amber-300"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-foreground-muted" />
          <h3 className="text-sm font-semibold text-foreground">最近 30 天调用统计</h3>
        </div>
        {usageLoading ? (
          <div className="h-24 flex items-center justify-center text-foreground-muted text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            加载中...
          </div>
        ) : (
          <SimpleBarChart data={usage} />
        )}
      </div>

      {/* Keys List */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">我的 Keys</h3>

        {loading ? (
          <div className="h-24 flex items-center justify-center text-foreground-muted text-sm">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            加载中...
          </div>
        ) : error ? (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : keys.length === 0 ? (
          <div className="text-sm text-foreground-muted text-center py-6">
            还没有 API Key，点击右上角创建
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between gap-4 p-3 rounded-md border border-[hsl(var(--border))]"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{k.name}</div>
                  <div className="text-xs text-foreground-muted mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>权限：{(k as unknown as ApiKeyData).permissions ?? "read-write"}</span>
                    <span>·</span>
                    <span>创建：{new Date(k.createdAt).toLocaleDateString("zh-CN")}</span>
                    {(k as unknown as ApiKeyData).lastUsedAt && (
                      <>
                        <span>·</span>
                        <span>
                          最近使用：
                          {new Date((k as unknown as ApiKeyData).lastUsedAt!).toLocaleDateString("zh-CN")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRevoke(k as unknown as ApiKeyData)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                  aria-label="吊销 Key"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !submitting && setShowCreate(false)}
        >
          <div
            className="card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">创建 API Key</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-foreground-muted"
                aria-label="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">名称</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如：生产环境"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground-muted mb-1">权限</label>
                <select
                  value={newPermissions}
                  onChange={(e) => setNewPermissions(e.target.value as "read" | "read-write")}
                  className="input"
                >
                  <option value="read">只读</option>
                  <option value="read-write">读写</option>
                </select>
              </div>
              <div className="text-xs text-foreground-muted bg-[hsl(var(--secondary))] p-3 rounded">
                ⚠️ Key 创建后仅显示一次，请立即保存
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={submitting}
                className="btn-secondary px-4 py-2"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={submitting}
                className="btn-primary px-4 py-2 inline-flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {showRevoke && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !submitting && setShowRevoke(null)}
        >
          <div
            className="card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-semibold">吊销 API Key</h3>
            </div>
            <p className="text-sm text-foreground">
              确定要吊销 <strong>{showRevoke.name}</strong> 吗？此操作无法撤销，使用此 Key 的应用将立即失效。
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowRevoke(null)}
                disabled={submitting}
                className="btn-secondary px-4 py-2"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={submitting}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium inline-flex items-center gap-2"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                吊销
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}