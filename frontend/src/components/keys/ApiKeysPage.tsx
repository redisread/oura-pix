/**
 * ApiKeysPage Component
 *
 * Manage API keys for programmatic access to /api/v1/* endpoints
 */

"use client";

import { useState } from "react";
import { AlertTriangle, Ban, Check, Copy, KeyRound, Plus, X } from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { StateMessage } from "@/components/StateMessage";

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyableKey({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked; user can still select manually */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="panel-muted inline-flex max-w-full items-center gap-2 px-2 py-1 text-xs"
    >
      <code className="break-all">{value}</code>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-[hsl(var(--color-success))]" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-foreground-muted" aria-hidden="true" />
      )}
    </button>
  );
}

function NewKeyModal({
  fullKey,
  prefix,
  onClose,
}: {
  fullKey: string;
  prefix: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground)/0.42)] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-key-modal-title"
    >
      <div
        className="panel w-full max-w-xl overflow-hidden p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="page-kicker">Credential issued</p>
            <h2 id="new-key-modal-title" className="font-display mt-1 text-2xl font-semibold text-foreground">
              API Key 已创建
            </h2>
          </div>
          <button onClick={onClose} className="icon-button h-9 w-9" aria-label="关闭">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="warning-banner mb-4 flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>请立即保存这个 Key。出于安全考虑，关闭此弹窗后无法再次查看完整 Key。</p>
        </div>
        <div className="panel-muted mb-4 p-3">
          <p className="panel-label mb-2">完整 Key</p>
          <CopyableKey value={fullKey} />
          <p className="font-utility mt-2 text-xs text-foreground-muted">
            前缀: <code>{prefix}</code>
          </p>
        </div>
        <div className="panel-muted mb-4 p-3">
          <p className="panel-label mb-1">使用示例</p>
          <pre className="font-utility overflow-x-auto whitespace-pre text-xs text-foreground">
{`curl -X POST https://api.ourapix.jiahongw.com/api/v1/generate \\
  -H "Authorization: Bearer ${prefix}..." \\
  -H "Content-Type: application/json" \\
  -d '{ "productImageId": "...", "settings": { ... } }'`}
          </pre>
        </div>
        <button onClick={onClose} className="btn-primary h-10 w-full">
          我已保存，关闭
        </button>
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  const { keys, loading, error, newlyCreated, setNewlyCreated, createKey, revokeKey } = useApiKeys();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const days = expiresInDays ? parseInt(expiresInDays, 10) : undefined;
    const result = await createKey(name.trim(), days);
    setSubmitting(false);
    if (result) {
      setShowCreate(false);
      setName("");
      setExpiresInDays("");
    }
  };

  return (
    <div className="workbench-page">
      <div className="workbench-container max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">Developer / API keys</p>
            <h1 className="page-title mt-2">API Keys</h1>
            <p className="page-description mt-3">
              通过 API Key 访问 <code className="font-utility text-sm">/api/v1/*</code> 端点
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary h-10 gap-2 px-4">
            <Plus className="h-4 w-4" aria-hidden="true" />
            创建 API Key
          </button>
        </header>

        {error && <StateMessage variant="error" message={error} className="mb-4" />}

        <div className="table-shell">
          {loading && keys.length === 0 ? (
            <StateMessage variant="loading" message="加载 API Keys..." />
          ) : keys.length === 0 ? (
            <StateMessage
              variant="empty"
              title="还没有 API Key"
              description="点击右上角创建第一个 API Key"
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--secondary)/0.72)] text-xs uppercase text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 text-left">名称</th>
                  <th className="px-4 py-3 text-left">Key</th>
                  <th className="px-4 py-3 text-left">状态</th>
                  <th className="px-4 py-3 text-left">最后使用</th>
                  <th className="px-4 py-3 text-left">过期时间</th>
                  <th className="px-4 py-3 text-left">创建时间</th>
                  <th className="w-20 px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} className="data-row">
                    <td className="px-4 py-3 font-semibold text-foreground">{k.name}</td>
                    <td className="px-4 py-3">
                      <code className="font-utility text-xs text-foreground-muted">
                        {k.keyPrefix}…
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      {k.isRevoked ? (
                        <span className="status-badge status-badge-error">已吊销</span>
                      ) : k.expiresAt && new Date(k.expiresAt) < new Date() ? (
                        <span className="status-badge status-badge-warning">已过期</span>
                      ) : (
                        <span className="status-badge status-badge-success">有效</span>
                      )}
                    </td>
                    <td className="font-utility px-4 py-3 text-xs text-foreground-muted">{formatDate(k.lastUsedAt)}</td>
                    <td className="font-utility px-4 py-3 text-xs text-foreground-muted">{formatDate(k.expiresAt)}</td>
                    <td className="font-utility px-4 py-3 text-xs text-foreground-muted">{formatDate(k.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {!k.isRevoked && (
                        <button
                          onClick={async () => {
                            if (confirm(`确定吊销 "${k.name}"?`)) await revokeKey(k.id);
                          }}
                          className="icon-button h-8 w-8 hover:text-[hsl(var(--color-error))]"
                          aria-label="吊销 API Key"
                        >
                          <Ban className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="info-banner mt-6">
          <h2 className="mb-1 font-semibold">使用说明</h2>
          <ul className="list-inside list-disc space-y-1 text-xs">
            <li>API Key 格式：<code className="font-utility rounded bg-[hsl(var(--card)/0.7)] px-1">op_</code> + 64 位十六进制</li>
            <li>认证方式：HTTP Header <code className="font-utility rounded bg-[hsl(var(--card)/0.7)] px-1">Authorization: Bearer op_xxx</code></li>
            <li>完整 Key 仅在创建时显示一次，请立即保存</li>
            <li>可吊销 Key 而非删除（吊销后无法恢复，但保留审计记录）</li>
          </ul>
        </div>

        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground)/0.42)] p-4"
            onClick={() => setShowCreate(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-key-title"
          >
            <form
              onSubmit={handleCreate}
              className="panel w-full max-w-md p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 id="create-key-title" className="font-display text-2xl font-semibold text-foreground">
                  创建 API Key
                </h2>
                <button type="button" onClick={() => setShowCreate(false)} className="icon-button h-9 w-9" aria-label="关闭">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mb-4">
                <label className="panel-label mb-1 block">名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：production-server"
                  className="input"
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="panel-label mb-1 block">过期天数（可选）</label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder="留空表示永不过期"
                  min={1}
                  max={365}
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary h-10 px-4">
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || submitting}
                  className="btn-primary h-10 gap-2 px-4 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  {submitting ? "创建中..." : "创建"}
                </button>
              </div>
            </form>
          </div>
        )}

        {newlyCreated && (
          <NewKeyModal
            fullKey={newlyCreated.key}
            prefix={newlyCreated.keyPrefix}
            onClose={() => setNewlyCreated(null)}
          />
        )}
      </div>
    </div>
  );
}
