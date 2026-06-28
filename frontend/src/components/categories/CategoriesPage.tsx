/**
 * CategoriesPage Component
 */

"use client";

import { useState, type ReactNode } from "react";
import { Sparkles, X } from "lucide-react";
import { localizeHref } from "@/paraglide/runtime.js";
import { useCategories, useCategoryTemplates, type Category, type Template } from "@/hooks/useCategories";
import * as m from "@/paraglide/messages.js";

function TemplateCard({
  template,
  isSelected,
  onClick,
}: {
  template: Template;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`panel w-full p-4 text-left transition-colors ${
        isSelected ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]" : "hover:border-[hsl(var(--primary)/0.5)]"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-foreground">{template.name}</h3>
        <span className={`status-badge ${template.isPreset ? "status-badge-info" : "status-badge-neutral"}`}>
          {template.isPreset ? m.categories_preset() : m.categories_custom()}
        </span>
      </div>
      {template.description && (
        <p className="mb-3 text-xs text-foreground-muted">{template.description}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(template.settings).map(([k, v]) => (
          <span key={k} className="status-badge status-badge-neutral">
            {k}: {String(v)}
          </span>
        ))}
      </div>
      {template.usageCount > 0 && (
        <p className="font-utility mt-3 text-xs text-foreground-muted">{m.categories_usageCount({ count: template.usageCount.toString() })}</p>
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
    return (
      <CategoriesShell>
        <div className="panel-muted flex min-h-[320px] items-center justify-center p-12 text-center text-foreground-muted" aria-busy="true">{m.categories_loading()}</div>
      </CategoriesShell>
    );
  }

  if (error && categories.length === 0) {
    return (
      <CategoriesShell>
        <div className="error-banner" role="alert">
          <p className="font-semibold">{m.categories_loadErrorTitle()}</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
        <div className="panel-muted mt-4 flex min-h-[240px] flex-col items-center justify-center p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">{m.categories_unavailableTitle()}</h2>
          <p className="mt-2 max-w-md text-sm text-foreground-muted">
            {m.categories_unavailableDescription()}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-secondary mt-6 h-10 px-5"
          >{m.categories_reload()}</button>
        </div>
      </CategoriesShell>
    );
  }

  return (
    <CategoriesShell>
      {error && (
        <div className="error-banner mb-4" role="alert">
          <p className="font-semibold">{m.categories_partialErrorTitle()}</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="panel-muted flex min-h-[320px] items-center justify-center p-12 text-center text-foreground-muted">{m.categories_emptyTemplates()}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="panel overflow-hidden">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedId(cat.id);
                    setTab("templates");
                  }}
                  className={`data-row flex w-full items-center gap-3 px-4 py-3 text-left first:border-t-0 ${
                    selectedId === cat.id ? "bg-[hsl(var(--primary)/0.08)]" : ""
                  }`}
                >
                  <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-foreground">{cat.name}</span>
                    <span className="font-utility text-xs text-foreground-muted">{m.categories_templateCount({ count: String(cat.templateCount ?? 0) })}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <main className="lg:col-span-9">
            {selected ? (
              <CategoryDetail key={selected.id} category={selected} tab={tab} setTab={setTab} />
            ) : (
              <div className="panel-muted flex min-h-[320px] items-center justify-center p-12 text-center text-foreground-muted">{m.categories_selectPrompt()}</div>
            )}
          </main>
        </div>
      )}
    </CategoriesShell>
  );
}

function CategoriesShell({ children }: { children: ReactNode }) {
  return (
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-8 max-w-3xl">
          <p className="page-kicker">{m.categories_kicker()}</p>
          <h1 className="page-title mt-2">{m.categories_title()}</h1>
          <p className="page-description mt-3">{m.categories_subtitle()}</p>
        </header>

        {children}
      </div>
    </div>
  );
}

function CategoryDetail({
  category,
  tab,
  setTab,
}: {
  category: Category;
  tab: "templates" | "practices";
  setTab: (t: "templates" | "practices") => void;
}) {
  const { templates, loading, error } = useCategoryTemplates(category.id);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[hsl(var(--border))] p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">{category.icon}</span>
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground">{category.name}</h2>
            <p className="text-sm text-foreground-muted">{category.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTab("templates")}
            className={`segmented-option ${tab === "templates" ? "segmented-option-active" : ""}`}
          >
            {m.categories_templatesTab({ count: templates.length.toString() })}
          </button>
          <button
            onClick={() => setTab("practices")}
            className={`segmented-option ${tab === "practices" ? "segmented-option-active" : ""}`}
          >
            {m.categories_practicesTab()}
          </button>
        </div>
      </div>

      <div className="p-6">
        {tab === "templates" ? (
          <>
            {error && (
              <div className="error-banner mb-4">
                <p>{error}</p>
              </div>
            )}
            {loading && templates.length === 0 ? (
              <p className="py-8 text-center text-foreground-muted">{m.common_loading()}</p>
            ) : templates.length === 0 ? (
              <p className="py-8 text-center text-foreground-muted">{m.categories_noTemplates()}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {templates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    isSelected={selectedTemplate?.id === t.id}
                    onClick={() => setSelectedTemplate(t)}
                  />
                ))}
              </div>
            )}
            {selectedTemplate && (
              <div className="panel-muted mt-6 p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-foreground">{m.categories_useTemplate({ name: selectedTemplate.name })}</h3>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="icon-button h-8 w-8"
                    aria-label={m.common_close()}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <a href={localizeHref(`/generate?template=${selectedTemplate.id}`)} className="btn-primary h-10 gap-2 px-4">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />{m.categories_generateWithTemplateShort()}</a>
              </div>
            )}
          </>
        ) : (
          <pre className="panel-muted whitespace-pre-wrap p-4 text-sm text-foreground">
            {category.bestPractices ?? m.categories_noBestPractices()}
          </pre>
        )}
      </div>
    </section>
  );
}
