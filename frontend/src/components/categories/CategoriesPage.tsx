/**
 * CategoriesPage Component
 */

"use client";

import { useState, type ReactNode } from "react";
import { Sparkles, X } from "lucide-react";
import { localizeHref } from "@/paraglide/runtime.js";
import { useCategories, useCategoryTemplates, type Category, type Template } from "@/hooks/useCategories";

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
          {template.isPreset ? "预设" : "自定义"}
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
        <p className="font-utility mt-3 text-xs text-foreground-muted">使用 {template.usageCount} 次</p>
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
        <div className="panel-muted flex min-h-[320px] items-center justify-center p-12 text-center text-foreground-muted" aria-busy="true">
          加载商品类目...
        </div>
      </CategoriesShell>
    );
  }

  if (error && categories.length === 0) {
    return (
      <CategoriesShell>
        <div className="error-banner" role="alert">
          <p className="font-semibold">无法加载商品类目</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
        <div className="panel-muted mt-4 flex min-h-[240px] flex-col items-center justify-center p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">类目模板暂时不可用</h2>
          <p className="mt-2 max-w-md text-sm text-foreground-muted">
            确认 API 服务可访问后刷新页面，已保存的导航和页面上下文不会丢失。
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-secondary mt-6 h-10 px-5"
          >
            重新加载
          </button>
        </div>
      </CategoriesShell>
    );
  }

  return (
    <CategoriesShell>
      {error && (
        <div className="error-banner mb-4" role="alert">
          <p className="font-semibold">部分类目信息未更新</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="panel-muted flex min-h-[320px] items-center justify-center p-12 text-center text-foreground-muted">
          暂无类目模板
        </div>
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
                    <span className="font-utility text-xs text-foreground-muted">{cat.templateCount ?? 0} 模板</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <main className="lg:col-span-9">
            {selected ? (
              <CategoryDetail key={selected.id} category={selected} tab={tab} setTab={setTab} />
            ) : (
              <div className="panel-muted flex min-h-[320px] items-center justify-center p-12 text-center text-foreground-muted">
                选择一个类目查看模板和最佳实践
              </div>
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
          <p className="page-kicker">Catalog / Templates</p>
          <h1 className="page-title mt-2">商品类目与模板</h1>
          <p className="page-description mt-3">选择类目，使用预设模板快速生成</p>
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
            模板 ({templates.length})
          </button>
          <button
            onClick={() => setTab("practices")}
            className={`segmented-option ${tab === "practices" ? "segmented-option-active" : ""}`}
          >
            最佳实践
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
              <p className="py-8 text-center text-foreground-muted">加载中...</p>
            ) : templates.length === 0 ? (
              <p className="py-8 text-center text-foreground-muted">暂无模板</p>
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
                  <h3 className="font-semibold text-foreground">使用模板: {selectedTemplate.name}</h3>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="icon-button h-8 w-8"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <a href={localizeHref(`/generate?template=${selectedTemplate.id}`)} className="btn-primary h-10 gap-2 px-4">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  用此模板生成
                </a>
              </div>
            )}
          </>
        ) : (
          <pre className="panel-muted whitespace-pre-wrap p-4 text-sm text-foreground">
            {category.bestPractices ?? "暂无最佳实践"}
          </pre>
        )}
      </div>
    </section>
  );
}
