/**
 * ApiKeysPage Component
 *
 * Manage API keys for programmatic access to /api/v1/* endpoints
 */

"use client";

import { useState } from "react";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { AlertTriangle, Ban, Check, Copy, KeyRound, Plus, X } from "lucide-react";
import { useApiKeys } from "@/hooks/useApiKeys";
import { StateMessage } from "@/components/StateMessage";
import { formatShortDateTime } from "@/lib/locale";
import { PageHeader } from "@/components/layout/PageHeader";
import { WorkbenchPageLayout } from "@/components/layout/WorkbenchPageLayout";
import * as m from "@/paraglide/messages.js";

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
    <Modal
      open={true}
      onClose={onClose}
      size="xl"
      contentProps={{ "aria-labelledby": "new-key-modal-title" }}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="page-kicker">{m.apiKeys_createdKicker()}</p>
          <h2 id="new-key-modal-title" className="font-display mt-1 text-2xl font-semibold text-foreground">
            {m.apiKeys_createdTitle()}
          </h2>
        </div>
        <button onClick={onClose} className="icon-button h-9 w-9" aria-label={m.common_close()}>
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="warning-banner mb-4 flex gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>{m.apiKeys_createdWarning()}</p>
      </div>
      <div className="panel-muted mb-4 p-3">
        <p className="panel-label mb-2">{m.apiKeys_fullKey()}</p>
        <CopyableKey value={fullKey} />
        <p className="font-utility mt-2 text-xs text-foreground-muted">
          {m.apiKeys_prefix()} <code>{prefix}</code>
        </p>
      </div>
      <div className="panel-muted mb-4 p-3">
        <p className="panel-label mb-1">{m.apiKeys_usageExample()}</p>
        <pre className="font-utility overflow-x-auto whitespace-pre text-xs text-foreground">
{`curl -X POST https://api.ourapix.jiahongw.com/api/v1/generate \\
  -H "Authorization: Bearer ${prefix}..." \\
  -H "Content-Type: application/json" \\
  -d '{ "productImageId": "...", "settings": { ... } }'`}
        </pre>
      </div>
      <button onClick={onClose} className="btn-primary h-10 w-full">{m.apiKeys_savedClose()}</button>
    </Modal>
  );
}

export default function ApiKeysPage() {
  const { keys, loading, error, newlyCreated, setNewlyCreated, createKey, revokeKey } = useApiKeys();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

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
    <WorkbenchPageLayout maxWidth="max-w-6xl">
      <PageHeader
        kicker={m.apiKeys_developerKicker()}
        title={m.apiKeys_title()}
        description={m.apiKeys_subtitle({ path: "/api/v1/*" })}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary h-10 gap-2 px-4">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {m.apiKeys_createButton()}
          </button>
        }
      />

        {error && <StateMessage variant="error" message={error} className="mb-4" />}

        <div className="table-shell">
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
              <thead className="bg-[hsl(var(--secondary)/0.72)] text-xs uppercase text-foreground-muted">
                <tr>
                  <th className="px-4 py-3 text-left">{m.apiKeys_columnName()}</th>
                  <th className="px-4 py-3 text-left">{m.apiKeys_columnKeyShort()}</th>
                  <th className="px-4 py-3 text-left">{m.apiKeys_columnStatus()}</th>
                  <th className="px-4 py-3 text-left">{m.apiKeys_columnLastUsed()}</th>
                  <th className="px-4 py-3 text-left">{m.apiKeys_columnExpiresAt()}</th>
                  <th className="px-4 py-3 text-left">{m.apiKeys_columnCreatedAt()}</th>
                  <th className="w-20 px-4 py-3 text-right">{m.apiKeys_columnActions()}</th>
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
                        <span className="status-badge status-badge-error">{m.apiKeys_statusRevoked()}</span>
                      ) : k.expiresAt && new Date(k.expiresAt) < new Date() ? (
                        <span className="status-badge status-badge-warning">{m.apiKeys_statusExpired()}</span>
                      ) : (
                        <span className="status-badge status-badge-success">{m.apiKeys_statusActive()}</span>
                      )}
                    </td>
                    <td className="font-utility px-4 py-3 text-xs text-foreground-muted">{k.lastUsedAt ? formatShortDateTime(k.lastUsedAt) : "-"}</td>
                    <td className="font-utility px-4 py-3 text-xs text-foreground-muted">{k.expiresAt ? formatShortDateTime(k.expiresAt) : "-"}</td>
                    <td className="font-utility px-4 py-3 text-xs text-foreground-muted">{formatShortDateTime(k.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {!k.isRevoked && (
                        <button
                          onClick={() => setConfirmRevoke(k.id)}
                          className="icon-button h-8 w-8 hover:text-[hsl(var(--color-error))]"
                          aria-label={m.apiKeys_revokeAria()}
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
          <h2 className="mb-1 font-semibold">{m.apiKeys_helpTitle()}</h2>
          <ul className="list-inside list-disc space-y-1 text-xs">
            <li>{m.apiKeys_formatHelp({ prefix: "op_" })}</li>
            <li>{m.apiKeys_authHelp({ header: "Authorization: Bearer op_xxx" })}</li>
            <li>{m.apiKeys_saveHelp()}</li>
            <li>{m.apiKeys_revokeHelp()}</li>
          </ul>
        </div>

        {showCreate && (
          <Modal open={true} onClose={() => setShowCreate(false)} contentProps={{ "aria-labelledby": "create-key-title" }}>
            <form onSubmit={handleCreate}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 id="create-key-title" className="font-display text-2xl font-semibold text-foreground">
                  {m.apiKeys_createButton()}
                </h2>
                <button type="button" onClick={() => setShowCreate(false)} className="icon-button h-9 w-9" aria-label={m.common_close()}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mb-4">
                <label className="panel-label mb-1 block">{m.apiKeys_columnName()}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={m.apiKeys_namePlaceholder()}
                  className="input"
                  maxLength={100}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-6">
                <label className="panel-label mb-1 block">{m.apiKeys_expiresLabel()}</label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  placeholder={m.apiKeys_expiresPlaceholder()}
                  min={1}
                  max={365}
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary h-10 px-4">{m.common_cancel()}</button>
                <button
                  type="submit"
                  disabled={!name.trim() || submitting}
                  className="btn-primary h-10 gap-2 px-4 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  {submitting ? m.apiKeys_creating() : m.apiKeys_create()}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {newlyCreated && (
          <NewKeyModal
            fullKey={newlyCreated.key}
            prefix={newlyCreated.keyPrefix}
            onClose={() => setNewlyCreated(null)}
          />
        )}
      <ConfirmModal
        open={confirmRevoke !== null}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={async () => {
          if (confirmRevoke) await revokeKey(confirmRevoke);
          setConfirmRevoke(null);
        }}
        title={m.apiKeys_revokeTitle()}
        description={
          confirmRevoke
            ? m.apiKeys_revokeConfirm({ name: keys.find((k) => k.id === confirmRevoke)?.name ?? "" })
            : ""
        }
        confirmLabel={m.apiKeys_revoke()}
      />
    </WorkbenchPageLayout>
  );
}
