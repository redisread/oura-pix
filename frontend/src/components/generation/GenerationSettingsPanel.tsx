"use client";

import { Check, Eye, Loader2, Settings, Sparkles } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import type { GenerationLanguage } from "@oura-pix/i18n";
import PromptTemplates from "./PromptTemplates";

type Platform = "amazon" | "shopify" | "ebay" | "etsy" | "generic";
type Style = "minimal" | "luxury" | "lifestyle" | "professional";
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface GenerationSettings {
  platform: Platform;
  count: number;
  style: Style;
  language: GenerationLanguage;
  generateImages: boolean;
  imageCount: number;
  aspectRatio: AspectRatio;
  allowPersons: boolean;
}

interface PreviewResult {
  title: string;
  description: string;
  keywords: string[];
}

interface GenerationSettingsPanelProps {
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
  promptText: string;
  onPromptTextChange: (text: string) => void;
  onPreview: () => void;
  onGenerate: () => void;
  onClearPreview: () => void;
  isPreviewing: boolean;
  isUploading: boolean;
  isGenerating: boolean;
  canGenerate: boolean;
  error: string | null;
  previewResult: PreviewResult | null;
}

const platforms: { value: Platform; label: string; icon: string }[] = [
  { value: "amazon", label: "Amazon", icon: "A" },
  { value: "shopify", label: "Shopify", icon: "S" },
  { value: "ebay", label: "eBay", icon: "E" },
  { value: "etsy", label: "Etsy", icon: "T" },
  { value: "generic", label: m.common_custom(), icon: "C" },
];

const styles: { value: Style; label: string; description: string }[] = [
  { value: "minimal", label: m.style_minimal_label(), description: m.style_minimal_desc() },
  { value: "luxury", label: m.style_luxury_label(), description: m.style_luxury_desc() },
  { value: "lifestyle", label: m.style_lifestyle_label(), description: m.style_lifestyle_desc() },
  { value: "professional", label: m.style_professional_label(), description: m.style_professional_desc() },
];

export default function GenerationSettingsPanel({
  settings,
  onSettingsChange,
  promptText,
  onPromptTextChange,
  onPreview,
  onGenerate,
  onClearPreview,
  isPreviewing,
  isUploading,
  isGenerating,
  canGenerate,
  error,
  previewResult,
}: GenerationSettingsPanelProps) {
  return (
    <div className="card overflow-hidden">
      <div className="proof-strip h-1.5" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-[hsl(var(--primary))]" />
          <h2 className="text-lg font-semibold text-foreground">{m.generation_settings()}</h2>
        </div>

        <PromptTemplates
          platform={settings.platform}
          style={settings.style}
          onSelect={(tpl) => onPromptTextChange(tpl.template)}
          onHistorySelect={(rec) => {
            onPromptTextChange(rec.prompt || "");
            onSettingsChange({
              ...settings,
              platform: rec.platform as Platform,
              style: rec.style as Style,
              language: rec.language as GenerationLanguage,
            });
          }}
        />

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Prompt 提示词（可选）
          </label>
          <textarea
            value={promptText}
            onChange={(e) => onPromptTextChange(e.target.value)}
            placeholder="输入额外的产品描述或要求，或选择上方模板"
            rows={3}
            className="input resize-y"
          />
          <div className="text-xs text-foreground-muted mt-1">
            {promptText.length} / 500 字符
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            {m.generation_platform()}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {platforms.map((platform) => (
              <button
                key={platform.value}
                type="button"
                onClick={() => onSettingsChange({ ...settings, platform: platform.value })}
                className={`
                  flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all duration-200
                  ${settings.platform === platform.value
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--foreground-muted)/0.3)]"
                  }
                `}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-[hsl(var(--foreground))] text-sm font-bold text-[hsl(var(--background))]"
                  aria-hidden="true"
                >
                  {platform.icon}
                </span>
                <span className="mt-2 text-sm font-medium text-foreground">
                  {platform.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            {m.generation_count()}
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              aria-label={m.generation_count()}
              min={5}
              max={10}
              step={1}
              value={settings.count}
              onChange={(e) => onSettingsChange({ ...settings, count: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-[hsl(var(--secondary))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--primary))]"
            />
            <span className="w-12 text-center text-lg font-semibold text-foreground">
              {settings.count}
            </span>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">{m.generation_countDesc()}</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            {m.generation_style()}
          </label>
          <div className="space-y-2">
            {styles.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => onSettingsChange({ ...settings, style: style.value })}
                className={`
                  w-full flex items-center justify-between rounded-lg border-2 p-3 text-left transition-all duration-200
                  ${settings.style === style.value
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--foreground-muted)/0.3)]"
                  }
                `}
              >
                <div>
                  <span className="block text-sm font-medium text-foreground">
                    {style.label}
                  </span>
                  <span className="block text-xs text-foreground-muted">
                    {style.description}
                  </span>
                </div>
                {settings.style === style.value && (
                  <Check className="h-5 w-5 text-[hsl(var(--primary))]" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            {m.generation_outputLang()}
          </label>
          <select
            value={settings.language}
            onChange={(e) => onSettingsChange({ ...settings, language: e.target.value as GenerationLanguage })}
            className="input"
          >
            <option value="zh">{m.language_zh()}</option>
            <option value="en">{m.language_en()}</option>
            <option value="ja">{m.language_ja()}</option>
          </select>
        </div>

        {/* Image Generation Toggle - HIDDEN for launch (P0 T1 #83) */}
        {/* Original code preserved below, uncomment when launching image generation
        <div className="mb-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.42)] p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {m.generation_imageGen_title()}
              </h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                {m.generation_imageGen_desc()}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSettingsChange({ ...settings, generateImages: !settings.generateImages })}
              aria-label={m.generation_imageGen_title()}
              aria-pressed={settings.generateImages}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                ${settings.generateImages ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--secondary))]"}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                  ${settings.generateImages ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>

          {settings.generateImages && (
            <div className="space-y-4 pt-4 border-t border-[hsl(var(--border))]">
              <div>
                <label className="block text-xs font-medium text-foreground mb-2">
                  {m.generation_imageGen_count()}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    aria-label={m.generation_imageGen_count()}
                    min={3}
                    max={10}
                    step={1}
                    value={settings.imageCount}
                    onChange={(e) => onSettingsChange({ ...settings, imageCount: parseInt(e.target.value) })}
                    className="flex-1 h-1.5 bg-[hsl(var(--secondary))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--primary))]"
                  />
                  <span className="w-8 text-center text-sm font-semibold text-foreground">
                    {settings.imageCount}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-2">
                  {m.generation_imageGen_aspectRatio()}
                </label>
                <select
                  value={settings.aspectRatio}
                  onChange={(e) => onSettingsChange({ ...settings, aspectRatio: e.target.value as AspectRatio })}
                  className="input text-xs"
                >
                  <option value="1:1">1:1</option>
                  <option value="3:4">3:4</option>
                  <option value="4:3">4:3</option>
                  <option value="9:16">9:16</option>
                  <option value="16:9">16:9</option>
                </select>
              </div>
            </div>
          )}
        </div>
        */}

        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg mb-6">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            🚧 图片生成功能即将上线，敬请期待
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-[hsl(var(--color-error-light))] p-3 text-sm font-medium text-[hsl(var(--color-error))]">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPreview}
            disabled={!canGenerate || isPreviewing || isUploading}
            className={`
              btn-secondary flex-1 h-12 text-base flex items-center justify-center gap-2
              ${!canGenerate || isPreviewing || isUploading
                ? "opacity-50 cursor-not-allowed"
                : ""
              }
            `}
          >
            {isPreviewing ? (
              <>
                <Loader2 className="h-5 w-5" />
                预览中...
              </>
            ) : (
              <>
                <Eye className="h-5 w-5" />
                预览
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className={`
              btn-primary flex-1 h-12 text-base flex items-center justify-center gap-2
              ${canGenerate
                ? ""
                : "opacity-50 cursor-not-allowed"
              }
            `}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5" />
                {m.generation_uploadingBtn()}
              </>
            ) : isGenerating ? (
              <>
                <Sparkles className="h-5 w-5 animate-pulse" />
                {m.generation_generatingBtn()}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {m.generation_generateBtn()}
              </>
            )}
          </button>
        </div>

        {previewResult && (
          <div className="mt-4 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                预览示例
              </span>
              <button
                type="button"
                onClick={onClearPreview}
                className="text-xs text-foreground-muted hover:text-foreground"
                aria-label="关闭预览"
              >
                ✕ 关闭
              </button>
            </div>
            <div>
              <div className="text-xs font-medium text-foreground-muted mb-1">标题</div>
              <div className="text-sm font-semibold text-foreground">{previewResult.title}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-foreground-muted mb-1">描述</div>
              <div className="text-sm text-foreground">{previewResult.description}</div>
            </div>
            {previewResult.keywords.length > 0 && (
              <div>
                <div className="text-xs font-medium text-foreground-muted mb-1">关键词</div>
                <div className="flex flex-wrap gap-1">
                  {previewResult.keywords.map((kw, idx) => (
                    <span key={idx} className="status-badge status-badge-neutral text-xs">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
