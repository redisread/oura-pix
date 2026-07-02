/**
 * CompetitorsPage Component
 */

"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ExternalLink, Link2, Plus, Save, Trash2, X } from "lucide-react";
import {
  getPlatformLabel,
  PLATFORMS,
  useCompetitors,
  type Competitor,
  type Platform,
} from "@/hooks/useCompetitors";
import { StateMessage } from "@/components/StateMessage";
import { formatLocaleDate } from "@/lib/locale";
import * as m from "@/paraglide/messages.js";

function formatDate(dateString: string): string {
  return formatLocaleDate(dateString, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function CompetitorForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Competitor;
  onSubmit: (data: Omit<Competitor, "id" | "createdAt">) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [platform, setPlatform] = useState<Platform>(initial?.platform ?? "amazon");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [screenshotInput, setScreenshotInput] = useState("");
  const [screenshots, setScreenshots] = useState<string[]>(initial?.screenshots ?? []);
  const [submitting, setSubmitting] = useState(false);

  const addScreenshot = () => {
    const trimmed = screenshotInput.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
      setScreenshots((prev) => [...prev, trimmed]);
      setScreenshotInput("");
    } catch {
      alert(m.competitors_invalidUrl());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setSubmitting(true);
    await onSubmit({
      name: name.trim(),
      url: url.trim(),
      platform,
      notes: notes.trim() || null,
      screenshots,
    });
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {initial ? m.competitors_formEditTitle() : m.competitors_formAddTitle()}
        </h2>
        <button type="button" onClick={onCancel} className="icon-button h-9 w-9" aria-label={m.common_close()}>
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div>
        <label className="panel-label mb-1 block">{m.competitors_nameLabel()}</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={m.competitors_namePlaceholder()}
          className="input"
          maxLength={200}
          required
        />
      </div>

      <div>
        <label className="panel-label mb-1 block">{m.competitors_urlLabel()}</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="input"
          maxLength={2000}
          required
        />
      </div>

      <div>
        <label className="panel-label mb-1 block">{m.competitors_platformLabel()}</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
          className="input"
        >
          {PLATFORMS.map((key) => (
            <option key={key} value={key}>
              {getPlatformLabel(key)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="panel-label mb-1 block">{m.competitors_notesLabel()}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={m.competitors_notesPlaceholder()}
          rows={3}
          className="input"
          maxLength={2000}
        />
      </div>

      <div>
        <label className="panel-label mb-1 block">{m.competitors_screenshotLabel()}</label>
        <div className="mb-2 flex gap-2">
          <input
            type="url"
            value={screenshotInput}
            onChange={(e) => setScreenshotInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addScreenshot();
              }
            }}
            placeholder={m.competitors_screenshotPlaceholder()}
            className="input flex-1"
          />
          <button type="button" onClick={addScreenshot} className="btn-secondary h-10 px-3">{m.common_add()}</button>
        </div>
        {screenshots.length > 0 && (
          <div className="space-y-1">
            {screenshots.map((s, i) => (
              <div key={i} className="panel-muted flex items-center gap-2 p-2 text-xs">
                <span className="font-utility flex-1 truncate text-foreground-muted">{s}</span>
                <button
                  type="button"
                  onClick={() => setScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
                  className="icon-button h-7 w-7 hover:text-[hsl(var(--color-error))]"
                  aria-label={m.competitors_removeScreenshotAria()}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary h-10 px-4">{m.common_cancel()}</button>
        <button
          type="submit"
          disabled={!name.trim() || !url.trim() || submitting}
          className="btn-primary h-10 gap-2 px-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          {submitting ? m.common_saving() : m.common_save()}
        </button>
      </div>
    </form>
  );
}

export default function CompetitorsPage() {
  const { competitors, loading, error, createCompetitor, updateCompetitor, deleteCompetitor } = useCompetitors();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);

  return (
    <div className="workbench-page">
      <div className="workbench-container max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">{m.competitors_kicker()}</p>
            <h1 className="page-title mt-2">{m.competitors_title()}</h1>
            <p className="page-description mt-3">{m.competitors_subtitle()}</p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="btn-primary h-10 gap-2 px-4"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />{m.competitors_formAddTitle()}</button>
        </header>

        {error && <StateMessage variant="error" message={error} className="mb-4" />}

        {loading && competitors.length === 0 ? (
          <StateMessage variant="loading" message={m.competitors_loading()} />
        ) : competitors.length === 0 ? (
          <StateMessage
            variant="empty"
            title={m.competitors_emptyTitle()}
            description={m.competitors_emptyDescription()}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {competitors.map((c) => (
              <article key={c.id} className="card card-hover p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-foreground">{c.name}</h2>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 truncate text-xs font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {c.url}
                    </a>
                  </div>
                  <span className="status-badge status-badge-neutral flex-shrink-0">
                    {getPlatformLabel(c.platform)}
                  </span>
                </div>
                {c.notes && (
                  <p className="mb-3 whitespace-pre-wrap text-sm text-foreground-muted">{c.notes}</p>
                )}
                {c.screenshots.length > 0 && (
                  <div className="mb-3 grid grid-cols-4 gap-2">
                    {c.screenshots.slice(0, 4).map((s, i) => (
                      <a
                        key={i}
                        href={s}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square overflow-hidden rounded-md bg-[hsl(var(--secondary))]"
                      >
                        <img src={s} alt={`Screenshot ${i + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                      </a>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3">
                  <span className="font-utility text-xs text-foreground-muted">{formatDate(c.createdAt)}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(c);
                        setShowForm(true);
                      }}
                      className="icon-button h-8 w-8"
                      aria-label={m.competitors_formEditTitle()}
                    >
                      <Link2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(m.competitors_deleteConfirm({ name: c.name }))) await deleteCompetitor(c.id);
                      }}
                      className="icon-button h-8 w-8 hover:text-[hsl(var(--color-error))]"
                      aria-label={m.competitors_deleteAria()}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {showForm && (
          <Modal
            open={true}
            onClose={() => { setShowForm(false); setEditing(null); }}
            size="xl"
            overlayClassName="overflow-y-auto"
            contentClassName="my-8"
          >
            <CompetitorForm
              initial={editing ?? undefined}
              onSubmit={async (data) => {
                if (editing) {
                  await updateCompetitor(editing.id, data);
                } else {
                  await createCompetitor(data);
                }
                setShowForm(false);
                setEditing(null);
              }}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
