/**
 * ApiKeysPage Component
 *
 * Manage API keys for programmatic access to /api/v1/* endpoints
 */

"use client";

import { useState } from "react";
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
      className="inline-flex items-center gap-2 px-2 py-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
    >
      <code className="break-all">{value}</code>
      <span className="text-slate-500">{copied ? "✓" : "📋"}</span>
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          API Key 已创建
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          ⚠️ 请立即保存这个 Key。出于安全考虑，<strong>关闭此弹窗后无法再次查看完整 Key</strong>。
        </p>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3 mb-4">
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">完整 Key：</p>
          <CopyableKey value={fullKey} />
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
            前缀: <code>{prefix}</code>
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 mb-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">使用示例：</p>
          <pre className="text-xs font-mono overflow-x-auto whitespace-pre">
{`curl -X POST https://api.ourapix.jiahongw.com/api/v1/generate \\
  -H "Authorization: Bearer ${prefix}..." \\
  -H "Content-Type: application/json" \\
  -d '{ "productImageId": "...", "settings": { ... } }'`}
          </pre>
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800"
        >
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
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">API Keys</h1>
          <p className="text-sm text-slate-500 mt-1">通过 API Key 访问 <code className="text-xs">/api/v1/*</code> 端点</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded hover:bg-slate-800"
        >
          + 创建 API Key
        </button>
      </div>

      {error && <StateMessage variant="error" message={error} className="mb-4" />}

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
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
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">名称</th>
                <th className="px-4 py-3 text-left">Key</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">最后使用</th>
                <th className="px-4 py-3 text-left">过期时间</th>
                <th className="px-4 py-3 text-left">创建时间</th>
                <th className="px-4 py-3 text-right w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {k.name}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                      {k.keyPrefix}…
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    {k.isRevoked ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        已吊销
                      </span>
                    ) : k.expiresAt && new Date(k.expiresAt) < new Date() ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        已过期
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        有效
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(k.lastUsedAt)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(k.expiresAt)}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(k.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {!k.isRevoked && (
                      <button
                        onClick={async () => {
                          if (confirm(`确定吊销 "${k.name}"?`)) await revokeKey(k.id);
                        }}
                        className="text-xs text-slate-500 hover:text-red-500"
                      >
                        吊销
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-sm text-blue-800 dark:text-blue-300">
        <h3 className="font-medium mb-1">使用说明</h3>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li>API Key 格式：<code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">op_</code> + 64 位十六进制</li>
          <li>认证方式：HTTP Header <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">Authorization: Bearer op_xxx</code></li>
          <li>完整 Key 仅在创建时显示一次，请立即保存</li>
          <li>可吊销 Key 而非删除（吊销后无法恢复，但保留审计记录）</li>
        </ul>
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              创建 API Key
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="如：production-server"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                maxLength={100}
                required
                autoFocus
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                过期天数（可选）
              </label>
              <input
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="留空表示永不过期"
                min={1}
                max={365}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!name.trim() || submitting}
                className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
              >
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
  );
}
