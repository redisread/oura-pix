/**
 * CollectionsPage Component
 *
 * Manage favorites collections (color-labeled groupings).
 */

"use client";

import { useState } from "react";
import { FolderPlus, Pencil, Save, Trash2, X } from "lucide-react";
import { useCollections, type Collection } from "@/hooks/useCollections";
import { StateMessage } from "@/components/StateMessage";
import * as m from "@/paraglide/messages.js";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export default function CollectionsPage() {
  const { collections, loading, error, createCollection, updateCollection, deleteCollection } = useCollections();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="workbench-page">
      <div className="workbench-container max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">{m.collections_kicker()}</p>
            <h1 className="page-title mt-2">{m.collections_title()}</h1>
            <p className="page-description mt-3">{m.collections_subtitle()}</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary h-10 gap-2 px-4">
            <FolderPlus className="h-4 w-4" aria-hidden="true" />{m.collections_newButton()}</button>
        </header>

        {error && <StateMessage variant="error" message={error} className="mb-4" />}

        {loading && collections.length === 0 ? (
          <StateMessage variant="loading" message={m.collections_loading()} />
        ) : collections.length === 0 ? (
          <StateMessage
            variant="empty"
            title={m.collections_emptyTitle()}
            description={m.collections_emptyDescription()}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((c) => (
              <CollectionCard
                key={c.id}
                collection={c}
                isEditing={editingId === c.id}
                onEdit={() => setEditingId(c.id)}
                onCancel={() => setEditingId(null)}
                onUpdate={async (input) => {
                  const ok = await updateCollection(c.id, input);
                  if (ok) setEditingId(null);
                  return ok;
                }}
                onDelete={async () => {
                  if (confirm(m.collections_deleteConfirm({ name: c.name }))) {
                    await deleteCollection(c.id);
                  }
                }}
              />
            ))}
          </div>
        )}

        {showCreate && (
          <CreateCollectionModal
            onClose={() => setShowCreate(false)}
            onCreate={async (input) => {
              const result = await createCollection(input);
              if (result) setShowCreate(false);
              return result !== null;
            }}
          />
        )}
      </div>
    </div>
  );
}

function ColorSwatches({
  value,
  onChange,
  size = "h-7 w-7",
}: {
  value: string;
  onChange: (color: string) => void;
  size?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`${size} rounded-full border-2 ${
            value === c ? "border-[hsl(var(--foreground))]" : "border-transparent"
          }`}
          style={{ backgroundColor: c }}
          aria-label={c}
        />
      ))}
    </div>
  );
}

function CollectionCard({
  collection,
  isEditing,
  onEdit,
  onCancel,
  onUpdate,
  onDelete,
}: {
  collection: Collection;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdate: (input: { name?: string; color?: string; description?: string }) => Promise<boolean>;
  onDelete: () => Promise<void>;
}) {
  const [name, setName] = useState(collection.name);
  const [color, setColor] = useState(collection.color);
  const [description, setDescription] = useState(collection.description ?? "");

  if (isEditing) {
    return (
      <div className="panel space-y-3 border-[hsl(var(--primary)/0.5)] p-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className="input font-semibold"
          autoFocus
        />
        <ColorSwatches value={color} onChange={setColor} size="h-6 w-6" />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={m.collections_descriptionPlaceholder()}
          rows={2}
          maxLength={200}
          className="input"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary h-9 px-3">{m.common_cancel()}</button>
          <button
            onClick={() => onUpdate({ name: name.trim(), color, description: description.trim() || undefined })}
            className="btn-primary h-9 gap-2 px-3"
          >
            <Save className="h-4 w-4" aria-hidden="true" />{m.common_save()}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-hover p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className="h-4 w-4 flex-shrink-0 rounded-full"
            style={{ backgroundColor: collection.color }}
          />
          <h2 className="truncate font-semibold text-foreground">{collection.name}</h2>
        </div>
        <div className="flex flex-shrink-0 gap-1">
          <button onClick={onEdit} className="icon-button h-8 w-8" aria-label={m.collections_editAria()}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button onClick={onDelete} className="icon-button h-8 w-8 hover:text-[hsl(var(--color-error))]" aria-label={m.collections_deleteAria()}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {collection.description && (
        <p className="mb-3 line-clamp-2 text-sm text-foreground-muted">{collection.description}</p>
      )}
      <div className="font-utility text-xs text-foreground-muted">
        {m.collections_itemCount({ count: String(collection.itemCount ?? 0) })}
      </div>
    </div>
  );
}

function CreateCollectionModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { name: string; color?: string; description?: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onCreate({ name: name.trim(), color, description: description.trim() || undefined });
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground)/0.42)] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-modal-title"
    >
      <form
        onSubmit={handleSubmit}
        className="panel w-full max-w-md space-y-4 overflow-hidden p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="collection-modal-title" className="font-display text-2xl font-semibold text-foreground">{m.collections_newButton()}</h2>
          <button type="button" onClick={onClose} className="icon-button h-9 w-9" aria-label={m.common_close()}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div>
          <label className="panel-label mb-1 block">{m.collections_nameLabel()}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={m.collections_namePlaceholder()}
            maxLength={50}
            className="input"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="panel-label mb-2 block">{m.collections_colorLabel()}</label>
          <ColorSwatches value={color} onChange={setColor} />
        </div>

        <div>
          <label className="panel-label mb-1 block">{m.collections_descriptionPlaceholder()}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={200}
            className="input"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary h-10 px-4">{m.common_cancel()}</button>
          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="btn-primary h-10 px-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? m.collections_creating() : m.collections_create()}
          </button>
        </div>
      </form>
    </div>
  );
}
