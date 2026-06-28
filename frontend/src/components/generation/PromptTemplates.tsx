/**
 * Prompt Templates + History Reference (P0 T5 #87)
 *
 * Provides pre-built prompt templates and quick reuse from last 5 successful generations.
 */

import { useEffect, useState } from "react";
import { History, Sparkles } from "lucide-react";
import type { GenerationRecord } from "@/hooks/useGenerations";

export interface PromptTemplate {
  id: string;
  name: string;
  platform: "amazon" | "shopify" | "ebay" | "etsy" | "generic";
  style: "professional" | "lifestyle" | "minimal" | "luxury";
  template: string;
  description: string;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "ecommerce-basic",
    name: "电商基础款",
    platform: "generic",
    style: "professional",
    template: "为【{product}】生成专业电商文案，突出【{feature}】卖点，使用吸引人的开场和清晰的卖点列举。",
    description: "通用电商文案模板",
  },
  {
    id: "amazon-listing",
    name: "Amazon 上架款",
    platform: "amazon",
    style: "professional",
    template: "为【{product}】生成 Amazon 商品 listing：标题（< 200 字符）+ 5 点 Bullet + 产品描述。突出【{feature}】，符合 Amazon A9 算法。",
    description: "符合 Amazon A9 优化规则",
  },
  {
    id: "shopify-storytelling",
    name: "Shopify 故事款",
    platform: "shopify",
    style: "lifestyle",
    template: "为【{product}】撰写 Shopify 商品故事，融入使用场景和情感共鸣，结尾 CTA。",
    description: "生活方式/情感叙事",
  },
  {
    id: "luxury-premium",
    name: "奢侈品高级款",
    platform: "generic",
    style: "luxury",
    template: "为【{product}】撰写奢侈品文案，强调工艺、稀缺性和传承，语言精致克制。",
    description: "奢侈品调性",
  },
  {
    id: "minimalist-clean",
    name: "极简主义款",
    platform: "generic",
    style: "minimal",
    template: "为【{product}】生成极简风格文案，关键词精炼，留白留白。",
    description: "极简克制",
  },
  {
    id: "etsy-handmade",
    name: "Etsy 手作款",
    platform: "etsy",
    style: "lifestyle",
    template: "为【{product}】撰写 Etsy 手作商品描述，强调手工、材质和独特性。",
    description: "手工艺品类",
  },
];

interface PromptTemplatesProps {
  platform: string;
  style: string;
  onSelect: (template: PromptTemplate) => void;
  onHistorySelect: (record: GenerationRecord) => void;
}

export default function PromptTemplates({
  platform,
  style,
  onSelect,
  onHistorySelect,
}: PromptTemplatesProps) {
  const [history, setHistory] = useState<GenerationRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadHistory() {
      try {
        const res = await fetch("/api/generations?page=1&pageSize=5&filter=month", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data?.success && Array.isArray(data.data)) {
          setHistory(data.data.filter((r: GenerationRecord) => r.status === "completed").slice(0, 5));
        }
      } catch {
        // silently ignore
      }
    }
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTemplates = PROMPT_TEMPLATES.filter(
    (t) => t.platform === platform || t.platform === "generic"
  );

  return (
    <div className="mb-6 space-y-4">
      {/* Templates */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-foreground">Prompt 模板推荐</h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {filteredTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl)}
              className="text-left p-2.5 rounded-md border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.05)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{tpl.name}</span>
                <span className="text-xs text-foreground-muted">{tpl.style}</span>
              </div>
              <div className="text-xs text-foreground-muted mt-1 line-clamp-2">
                {tpl.description}
              </div>
            </button>
          ))}
        </div>
        {filteredTemplates.length === 0 && (
          <div className="text-xs text-foreground-muted text-center py-3">
            该平台暂无专属模板，已显示通用模板
          </div>
        )}
      </div>

      {/* History Reference */}
      {history.length > 0 && (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-foreground-muted" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">历史参考（最近 5 次成功）</h3>
          </div>
          <div className="space-y-1.5">
            {history.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => onHistorySelect(rec)}
                className="w-full text-left p-2 rounded-md hover:bg-[hsl(var(--secondary))] transition-colors flex items-center justify-between gap-2"
              >
                <span className="text-xs text-foreground line-clamp-1 flex-1">
                  {rec.prompt || rec.id.slice(0, 8)}
                </span>
                <span className="text-xs font-medium text-[hsl(var(--primary))] shrink-0">
                  使用此设置 →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}