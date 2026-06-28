/**
 * ApiKeysPage Component
 *
 * Manage API keys for programmatic access to /api/v1/* endpoints
 */

"use client";

import { useState } from "react";
import * as m from "@/paraglide/messages.js";
import { useApiKeys } from "@/hooks/useApiKeys";
import { StateMessage } from "@/components/StateMessage";
import { formatLocaleDateTime } from "@/lib/locale";

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return formatLocaleDateTime(dateString, {
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
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-xl w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {m.apiKeys_createdTitle()}
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          {m.apiKeys_createdWarning()}
        </p>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3 mb-4">
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">{m.apiKeys_fullKey()}</p>
          <CopyableKey value={fullKey} />
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
            {m.apiKeys_prefix()} <code>{prefix}</code>
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 rounded p-3 mb-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{m.apiKeys_usageExample()}</p>
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
          {m.apiKeys_savedClose()}
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{m.apiKeys_title()}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {m.apiKeys_subtitle({ path: "/api/v1/*" })}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded hover:bg-slate-800"
        >
          + {m.apiKeys_createButton()}
        </button>
      </div>

      {error && <StateMessage variant="error" message={error} className="mb-4" />}

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
        {loading && keys.length === 0 ? (
          <StateMessage variant="loading" message={m.apiKeys_loading()} />
        ) : keys.length === 0 ? (
          <StateMessage
            variant="empty"
            title={m.apiKeys_emptyTitle()}
            description={m.apiKeys_emptyDescription()}
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">{m.apiKeys_columnName()}</th>
                <th className="px-4 py-3 text-left">{m.apiKeys_columnKey()}</th>
                <th className="px-4 py-3 text-left">{m.apiKeys_columnStatus()}</th>
                <th className="px-4 py-3 text-left">{m.apiKeys_columnLastUsed()}</th>
                <th className="px-4 py-3 text-left">{m.apiKeys_columnExpiresAt()}</th>
                <th className="px-4 py-3 text-left">{m.apiKeys_columnCreatedAt()}</th>
                <th className="px-4 py-3 text-right w-20">{m.apiKeys_columnActions()}</th>
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
                        {m.apiKeys_statusRevoked()}
                      </span>
                    ) : k.expiresAt && new Date(k.expiresAt) < new Date() ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        {m.apiKeys_statusExpired()}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        {m.apiKeys_statusActive()}
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
                          if (confirm(m.apiKeys_revokeConfirm({ name: k.name }))) await revokeKey(k.id);
                        }}
                        className="text-xs text-slate-500 hover:text-red-500"
                      >
                        {m.apiKeys_revoke()}
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
        <h3 className="font-medium mb-1">{m.apiKeys_helpTitle()}</h3>
        <ul className="text-xs space-y-1 list-disc list-inside">
          <li>{m.apiKeys_formatHelp({ prefix: "op_" })}</li>
          <li>{m.apiKeys_authHelp({ header: "Authorization: Bearer op_xxx" })}</li>
          <li>{m.apiKeys_saveHelp()}</li>
          <li>{m.apiKeys_revokeHelp()}</li>
        </ul>
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleCreate}
            className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              {m.apiKeys_createModalTitle()}
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {m.apiKeys_nameLabel()}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={m.apiKeys_namePlaceholder()}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                maxLength={100}
                required
                autoFocus
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {m.apiKeys_expiresLabel()}
              </label>
              <input
                type="number"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder={m.apiKeys_expiresPlaceholder()}
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
                {m.common_cancel()}
              </button>
              <button
                type="submit"
                disabled={!name.trim() || submitting}
                className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
              >
                {submitting ? m.apiKeys_creating() : m.apiKeys_create()}
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
