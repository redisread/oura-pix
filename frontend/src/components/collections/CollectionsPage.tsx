/**
 * CollectionsPage Component
 *
 * Manage favorites collections (color-labeled groupings).
 */

"use client";

import { useState } from "react";
import * as m from "@/paraglide/messages.js";
import { useCollections, type Collection } from "@/hooks/useCollections";
import { StateMessage } from "@/components/StateMessage";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export default function CollectionsPage() {
  const { collections, loading, error, createCollection, updateCollection, deleteCollection } = useCollections();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{m.collections_title()}</h1>
          <p className="text-sm text-slate-500 mt-1">{m.collections_subtitle()}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded hover:bg-slate-800"
        >
          + {m.collections_newButton()}
        </button>
      </div>

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4 space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className="w-full px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
          autoFocus
        />
        <div className="flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full border-2 ${color === c ? "border-slate-900 dark:border-slate-100" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              aria-label={c}
            />
          ))}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={m.collections_descriptionPlaceholder()}
          rows={2}
          maxLength={200}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
        />
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded"
          >
            {m.common_cancel()}
          </button>
          <button
            onClick={() => onUpdate({ name: name.trim(), color, description: description.trim() || undefined })}
            className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
          >
            {m.common_save()}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: collection.color }}
          />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {collection.name}
          </h3>
        </div>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            {m.collections_edit()}
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-slate-500 hover:text-red-500"
          >
            {m.common_delete()}
          </button>
        </div>
      </div>
      {collection.description && (
        <p className="text-sm text-slate-500 mb-2 line-clamp-2">{collection.description}</p>
      )}
      <div className="text-xs text-slate-500">
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{m.collections_createTitle()}</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {m.collections_nameLabel()}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={m.collections_namePlaceholder()}
            maxLength={50}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {m.collections_colorLabel()}
          </label>
          <div className="flex gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full border-2 ${color === c ? "border-slate-900 dark:border-slate-100" : "border-transparent"}`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {m.collections_descriptionLabel()}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={200}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
          >
            {m.common_cancel()}
          </button>
          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? m.collections_creating() : m.collections_create()}
          </button>
        </div>
      </form>
    </div>
  );
}
