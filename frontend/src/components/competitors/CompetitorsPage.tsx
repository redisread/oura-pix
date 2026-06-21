/**
 * CompetitorsPage Component
 */

"use client";

import { useState } from "react";
import { useCompetitors, PLATFORM_LABELS, type Platform, type Competitor } from "@/hooks/useCompetitors";
import { StateMessage } from "@/components/StateMessage";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("zh-CN", {
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
      alert("请输入有效的 URL");
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
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        {initial ? "编辑竞品" : "添加竞品"}
      </h2>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          名称
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="如：Anker Soundcore 旗舰店"
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
          maxLength={200}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          链接
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
          maxLength={2000}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          平台
        </label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as Platform)}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
        >
          {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          笔记
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="可记录差异化点、定价、风格观察等"
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
          maxLength={2000}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          截图 URL（每行一个，最多 20 个）
        </label>
        <div className="flex gap-2 mb-2">
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
            placeholder="https://... 回车添加"
            className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
          />
          <button
            type="button"
            onClick={addScreenshot}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
          >
            添加
          </button>
        </div>
        {screenshots.length > 0 && (
          <div className="space-y-1">
            {screenshots.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded">
                <span className="flex-1 truncate font-mono text-slate-600 dark:text-slate-400">{s}</span>
                <button
                  type="button"
                  onClick={() => setScreenshots((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-slate-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!name.trim() || !url.trim() || submitting}
          className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? "保存中..." : "保存"}
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
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">竞品分析</h1>
          <p className="text-sm text-slate-500 mt-1">记录竞品链接、平台和笔记</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-slate-900 text-white text-sm rounded hover:bg-slate-800"
        >
          + 添加竞品
        </button>
      </div>

      {error && <StateMessage variant="error" message={error} className="mb-4" />}

      {loading && competitors.length === 0 ? (
        <StateMessage variant="loading" message="加载竞品..." />
      ) : competitors.length === 0 ? (
        <StateMessage
          variant="empty"
          title="还没有竞品记录"
          description="点击右上角添加第一个竞品"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {competitors.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{c.name}</h3>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block"
                  >
                    {c.url}
                  </a>
                </div>
                <span className="px-2 py-0.5 text-xs rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ml-2 flex-shrink-0">
                  {PLATFORM_LABELS[c.platform]}
                </span>
              </div>
              {c.notes && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 whitespace-pre-wrap">
                  {c.notes}
                </p>
              )}
              {c.screenshots.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {c.screenshots.slice(0, 4).map((s, i) => (
                    <a
                      key={i}
                      href={s}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square bg-slate-100 dark:bg-slate-800 rounded overflow-hidden"
                    >
                      <img src={s} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500">{formatDate(c.createdAt)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setShowForm(true);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    编辑
                  </button>
                  <button
                    onClick={async () => {
                      if (confirm(`确定删除 "${c.name}"?`)) await deleteCompetitor(c.id);
                    }}
                    className="text-xs text-slate-500 hover:text-red-500"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
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
          </div>
        </div>
      )}
    </div>
  );
}
