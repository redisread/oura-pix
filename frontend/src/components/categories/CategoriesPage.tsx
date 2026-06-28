/**
 * CategoriesPage Component
 */

"use client";

import { useState } from "react";
import { useCategories, useCategoryTemplates, type Category, type Template } from "@/hooks/useCategories";
import * as m from "@/paraglide/messages.js";

function TemplateCard({ template, isSelected, onClick }: { template: Template; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-lg border w-full transition-colors ${
        isSelected
          ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800"
          : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <h4 className="font-medium text-slate-900 dark:text-slate-100">{template.name}</h4>
        {template.isPreset ? (
          <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{m.categories_preset()}</span>
        ) : (
          <span className="px-1.5 py-0.5 text-xs rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">{m.categories_custom()}</span>
        )}
      </div>
      {template.description && <p className="text-xs text-slate-500 mb-2">{template.description}</p>}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(template.settings).map(([k, v]) => (
          <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {k}: {String(v)}
          </span>
        ))}
      </div>
      {template.usageCount > 0 && (
        <p className="text-xs text-slate-400 mt-2">
          {m.categories_usageCount({ count: template.usageCount.toString() })}
        </p>
      )}
    </button>
  );
}

export default function CategoriesPage() {
  const { categories, loading, error } = useCategories();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"templates" | "practices">("templates");
  const selected = categories.find((c) => c.id === selectedId) ?? null;

  if (loading && categories.length === 0) {
    return <div className="max-w-6xl mx-auto p-6 text-center text-slate-500">{m.common_loading()}</div>;
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{m.categories_title()}</h1>
        <p className="text-sm text-slate-500 mt-1">{m.categories_subtitle()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <aside className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedId(cat.id); setTab("templates"); }}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors ${
                  selectedId === cat.id ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 dark:text-slate-100">{cat.name}</div>
                    <div className="text-xs text-slate-500">
                      {m.categories_templateCount({ count: String(cat.templateCount ?? 0) })}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-9">
          {selected ? (
            <CategoryDetail key={selected.id} category={selected} tab={tab} setTab={setTab} />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center text-slate-500">
              {m.categories_selectPrompt()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CategoryDetail({ category, tab, setTab }: { category: Category; tab: "templates" | "practices"; setTab: (t: "templates" | "practices") => void }) {
  const { templates, loading, error } = useCategoryTemplates(category.id);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{category.icon}</span>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{category.name}</h2>
            <p className="text-sm text-slate-500">{category.description}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setTab("templates")}
            className={`px-3 py-1.5 text-sm rounded ${tab === "templates" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
          >
            {m.categories_templatesTab({ count: templates.length.toString() })}
          </button>
          <button
            onClick={() => setTab("practices")}
            className={`px-3 py-1.5 text-sm rounded ${tab === "practices" ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
          >
            {m.categories_practicesTab()}
          </button>
        </div>
      </div>

      <div className="p-6">
        {tab === "templates" ? (
          <>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded mb-4">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}
            {loading && templates.length === 0 ? (
              <p className="text-center text-slate-500 py-8">{m.common_loading()}</p>
            ) : templates.length === 0 ? (
              <p className="text-center text-slate-500 py-8">{m.categories_noTemplates()}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map((t) => (
                  <TemplateCard key={t.id} template={t} isSelected={selectedTemplate?.id === t.id} onClick={() => setSelectedTemplate(t)} />
                ))}
              </div>
            )}
            {selectedTemplate && (
              <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">
                    {m.categories_useTemplate({ name: selectedTemplate.name })}
                  </h3>
                  <button onClick={() => setSelectedTemplate(null)} className="text-slate-400 hover:text-slate-600" aria-label={m.common_close()}>✕</button>
                </div>
                <a href={`/generate?template=${selectedTemplate.id}`} className="inline-block mt-2 px-4 py-2 bg-slate-900 text-white text-sm rounded hover:bg-slate-800">
                  {m.categories_generateWithTemplate()}
                </a>
              </div>
            )}
          </>
        ) : (
          <pre className="text-xs whitespace-pre-wrap font-sans bg-slate-50 dark:bg-slate-800 p-3 rounded text-slate-700 dark:text-slate-300">
            {category.bestPractices ?? m.categories_noBestPractices()}
          </pre>
        )}
      </div>
    </div>
  );
}
