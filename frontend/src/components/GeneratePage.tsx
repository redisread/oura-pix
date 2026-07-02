"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Check, ClipboardCheck, Eye, Settings, Sparkles, Upload } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";
import { localeToGenerationLanguage, type GenerationLanguage, type Locale } from "@oura-pix/i18n";
import UploadDropzone from "./UploadDropzone";
import GenerationProgress, { type GenerationStage } from "./GenerationProgress";
import CompareView from "./compare/CompareView";
import PromptTemplates from "./generation/PromptTemplates";
import { uploadImage } from "@/lib/api";
import { createGeneration, getGeneration, previewGeneration } from "@/lib/api";
import { useToast, ToastProvider } from "./ui/Toast";

type Platform = "amazon" | "shopify" | "ebay" | "etsy" | "generic";

interface SceneImage {
  imageId?: string;
  url: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  promptUsed?: string;
  variation?: number;
}

interface GeneratedResult {
  id?: string;
  title?: string;
  description?: string;
  tags?: string[];
  imageUrl?: string;
  confidenceScore?: number;
  sceneImages?: SceneImage[];
  metadata?: Record<string, unknown>;
}
type Style = "minimal" | "luxury" | "lifestyle" | "professional";
type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

interface GenerationSettings {
  platform: Platform;
  count: number;
  style: Style;
  language: GenerationLanguage;
  generateImages: boolean;
  imageCount: number;
  aspectRatio: AspectRatio;
  allowPersons: boolean;
}

function currentUiLocale(): Locale {
  try {
    return getLocale() as Locale;
  } catch {
    return "zh-CN";
  }
}

export default function GeneratePage() {
  const toast = useToast();
  const [mainImage, setMainImage] = useState<File[]>([]);
  const [styleImages, setStyleImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>({
    platform: "amazon",
    count: 5,
    style: "minimal",
    language: localeToGenerationLanguage(currentUiLocale()),
    generateImages: true,
    imageCount: 5,
    aspectRatio: "1:1",
    allowPersons: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<GenerationStage>("analyzing");
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewResult, setPreviewResult] = useState<{ title: string; description: string; keywords: string[] } | null>(null);
  const [promptText, setPromptText] = useState(""); // P0 T5 #87
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleMainImageSelect = useCallback((files: File[]) => {
    setMainImage(files);
    setError(null);
  }, []);

  const handleStyleImagesSelect = useCallback((files: File[]) => {
    setStyleImages(files);
    setError(null);
  }, []);


  const pollGenerationStatus = async (genId: string) => {
    const { status, imageGenerationStatus, results } = await getGeneration(genId);

    if (status === "processing") {
      if (imageGenerationStatus === "processing") {
        setCurrentStage("generating_images");
        setProgress(70);
      } else if (imageGenerationStatus === "completed" || imageGenerationStatus === "skipped") {
        setCurrentStage("uploading");
        setProgress(90);
      } else {
        setCurrentStage("generating_text");
        setProgress(40);
      }
    }

    if (status === "completed" && results) {
      setCurrentStage("completed");
      setProgress(100);
      setIsGenerating(false);
      setGeneratedResults(results.filter((r): r is NonNullable<typeof r> => r !== null));
      toast.success("生成完成，点击查看结果");
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } else if (status === "failed") {
      setIsGenerating(false);
      setError(m.generation_failed());
      toast.error("生成失败，请重试", {
        action: {
          label: "重试",
          onClick: () => handleGenerate(),
        },
      });
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }
  };

  const handleGenerate = async () => {
    if (mainImage.length === 0) {
      setError(m.generation_error_noImage());
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);
    setCurrentStage("analyzing");
    setGeneratedResults([]);

    try {
      // Upload main image
      const mainImageResult = await uploadImage(mainImage[0], "product");
      if (!mainImageResult?.id) {
        setIsUploading(false);
        setError(m.generation_error_uploadFailed());
        return;
      }

      // Upload style images
      const styleImageIds: string[] = [];
      for (const file of styleImages) {
        const result = await uploadImage(file, "reference");
        if (result?.id) {
          styleImageIds.push(result.id);
        }
      }

      setIsUploading(false);
      setIsGenerating(true);

      // Create generation task
      const { id: generationId } = await createGeneration({
        productImageId: mainImageResult.id,
        referenceImageIds: styleImageIds.length > 0 ? styleImageIds : undefined,
        prompt: promptText.trim() || undefined,
        settings: {
          targetPlatform: settings.platform,
          count: settings.count,
          style: settings.style as "professional" | "lifestyle" | "minimal" | "luxury",
          language: settings.language,
          uiLocale: currentUiLocale(),
          generateImages: false, // P0 T1 #83: 图片生成功能隐藏中，强制关闭
          imageCount: settings.imageCount,
          aspectRatio: settings.aspectRatio,
          allowPersons: settings.allowPersons,
        },
      });

      // Start polling
      pollingRef.current = setInterval(() => {
        pollGenerationStatus(generationId);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : m.generation_error_failed());
      setIsUploading(false);
      setIsGenerating(false);
    }
  };

  const canGenerate = mainImage.length > 0 && !isGenerating && !isUploading;

  // P0 T4 #86 - Preview one variant
  const handlePreview = async () => {
    if (mainImage.length === 0) {
      setError(m.generation_error_noImage());
      return;
    }
    setError(null);
    setIsPreviewing(true);
    setPreviewResult(null);

    try {
      let productImageId: string | undefined;
      const mainImageResult = await uploadImage(mainImage[0], "product");
      if (mainImageResult?.id) {
        productImageId = mainImageResult.id;
      }

      const result = await previewGeneration({
        productImageId,
        prompt: undefined,
        settings: {
          targetPlatform: settings.platform,
          language: settings.language,
          uiLocale: currentUiLocale(),
          style: settings.style as "professional" | "lifestyle" | "minimal" | "luxury",
        },
      });

      if (!result.success || !result.data) {
        setError(result.error || "预览失败");
        return;
      }

      setPreviewResult(result.data.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "预览失败");
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-[hsl(var(--background))]">
        {/* Header */}
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="proof-strip h-2" />
          <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
            <div>
              <p className="font-utility text-xs font-semibold uppercase text-[hsl(var(--accent))]">
                Generation bench
              </p>
              <h1 className="font-display mt-2 text-4xl font-semibold text-foreground">
                {m.generation_title()}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-foreground-muted">
                {m.generation_subtitle()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Upload", "Specify", "Review"].map((step) => (
                <span
                  key={step}
                  className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.55)] px-3 py-1 text-xs font-semibold text-foreground-muted"
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1fr_1.08fr]">
            {/* Left: Upload Area */}
            <div className="space-y-6">
              <div className="card overflow-hidden">
                <div className="proof-strip h-1.5" />
                <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="h-5 w-5 text-[hsl(var(--primary))]" />
                  <h2 className="text-lg font-semibold text-foreground">{m.generation_uploadSection()}</h2>
                </div>

                <UploadDropzone
                  label={m.generation_mainImage()}
                  description={m.generation_mainImageDesc()}
                  accept="image/*"
                  multiple={false}
                  maxSize={10 * 1024 * 1024}
                  onFilesSelected={handleMainImageSelect}
                  required
                />

                <div className="mt-6">
                  <UploadDropzone
                    label={m.generation_styleImage()}
                    description={m.generation_styleImageDesc()}
                    accept="image/*"
                    multiple
                    maxFiles={3}
                    maxSize={10 * 1024 * 1024}
                    onFilesSelected={handleStyleImagesSelect}
                  />
                </div>
                </div>
              </div>

              {/* Tips */}
              <div className="card border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.06)] p-4">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)]">
                    <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{m.generation_uploadTips()}</h4>
                    <ul className="mt-1 text-sm text-foreground-muted space-y-1">
                      <li>{m.generation_uploadTip1()}</li>
                      <li>{m.generation_uploadTip2()}</li>
                      <li>{m.generation_uploadTip3()}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Settings Panel */}
            <div className="card overflow-hidden">
              <div className="proof-strip h-1.5" />
              <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="h-5 w-5 text-[hsl(var(--primary))]" />
                <h2 className="text-lg font-semibold text-foreground">{m.generation_settings()}</h2>
              </div>

              {/* Prompt Templates + History (P0 T5 #87) */}
              <PromptTemplates
                platform={settings.platform}
                style={settings.style}
                onSelect={(tpl) => setPromptText(tpl.template)}
                onHistorySelect={(rec) => {
                  setPromptText(rec.prompt || "");
                  setSettings({
                    ...settings,
                    platform: rec.platform as Platform,
                    style: rec.style as Style,
                    language: rec.language as GenerationLanguage,
                  });
                }}
              />

              {/* Prompt Input (P0 T5 #87) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Prompt 提示词（可选）
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="输入额外的产品描述或要求，或选择上方模板"
                  rows={3}
                  className="input resize-y"
                />
                <div className="text-xs text-foreground-muted mt-1">
                  {promptText.length} / 500 字符
                </div>
              </div>

              {/* Platform Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  {m.generation_platform()}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, platform: platform.value })}
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

              {/* Generation Count */}
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
                    onChange={(e) => setSettings({ ...settings, count: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-[hsl(var(--secondary))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--primary))]"
                  />
                  <span className="w-12 text-center text-lg font-semibold text-foreground">
                    {settings.count}
                  </span>
                </div>
                <p className="mt-1 text-xs text-foreground-muted">{m.generation_countDesc()}</p>
              </div>

              {/* Style Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  {m.generation_style()}
                </label>
                <div className="space-y-2">
                  {styles.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, style: style.value })}
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

              {/* Language Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  {m.generation_outputLang()}
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value as GenerationLanguage })}
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
                    onClick={() => setSettings({ ...settings, generateImages: !settings.generateImages })}
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
                          onChange={(e) => setSettings({ ...settings, imageCount: parseInt(e.target.value) })}
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
                        onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as AspectRatio })}
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

              {/* Coming Soon Notice (P0 T1 #83) */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg mb-6">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  🚧 图片生成功能即将上线，敬请期待
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 rounded-lg bg-[hsl(var(--color-error-light))] p-3 text-sm font-medium text-[hsl(var(--color-error))]">
                  {error}
                </div>
              )}

              {/* Preview & Generate Buttons (P0 T4 #86) */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handlePreview}
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
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
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
                  onClick={handleGenerate}
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
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
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

              {/* Preview Result (P0 T4 #86) */}
              {previewResult && (
                <div className="mt-4 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
                      预览示例
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewResult(null)}
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

            {/* Right: Preview Area */}
            <div className="card overflow-hidden">
              <div className="proof-strip h-1.5" />
              <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-[hsl(var(--primary))]" />
                <h2 className="text-lg font-semibold text-foreground">{m.generation_preview()}</h2>
              </div>

              {/* Progress */}
              {isGenerating && (
                <div className="mb-6">
                  <GenerationProgress
                    stage={currentStage}
                    progress={progress}
                    currentImageCount={0}
                    totalImageCount={settings.generateImages ? settings.imageCount : 0}
                  />
                </div>
              )}

              {/* Results Display */}
              {generatedResults.length > 0 ? (
                <div className="space-y-6">
                  {/* Demo Mode Banner */}
                  {generatedResults.some((r) => r.metadata?.mock) && (
                    <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--accent)/0.32)] bg-[hsl(var(--accent)/0.1)] p-3 text-sm font-medium text-[hsl(var(--accent))]">
                      <Sparkles className="w-4 h-4 flex-shrink-0" />
                      {m.generation_demoMode()}
                    </div>
                  )}
                  {/* Compare Button */}
                  {generatedResults.some(r => r.sceneImages && r.sceneImages.length > 1) && (
                    <button
                      type="button"
                      onClick={() => setShowCompare(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[hsl(var(--border))] p-3 text-sm font-semibold text-foreground-muted transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      {m.compare_buttonDesc()}
                    </button>
                  )}
                  {generatedResults.map((result, resultIndex) => (
                    <div key={result.id || resultIndex} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background)/0.38)] p-4">
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-foreground mb-2">
                          {result.title}
                        </h3>
                        <p className="text-sm text-foreground-muted line-clamp-3">
                          {result.description}
                        </p>
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {result.tags.slice(0, 5).map((tag: string, tagIndex: number) => (
                              <span
                                key={tagIndex}
                                className="inline-flex items-center rounded-full bg-[hsl(var(--primary)/0.1)] px-2.5 py-0.5 text-xs font-semibold text-[hsl(var(--primary))]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {result.sceneImages && result.sceneImages.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-foreground-muted mb-2">
                            {m.generation_sceneImages()} ({result.sceneImages.length})
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {result.sceneImages.map((img: SceneImage, imgIndex: number) => (
                              <div
                                key={img.imageId || imgIndex}
                                className="group relative aspect-square overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]"
                              >
                                <img
                                  src={img.url}
                                  alt={m.generation_sceneImageAlt({ index: String(img.variation) })}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[hsl(var(--background))]/80 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                                  <button
                                    type="button"
                                    onClick={() => window.open(img.url, "_blank")}
                                    className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[hsl(var(--primary-hover))]"
                                  >
                                    {m.generation_viewLarge()}
                                  </button>
                                  <a
                                    href={img.url}
                                    download
                                    className="rounded-md bg-[hsl(var(--secondary))] px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-[hsl(var(--secondary-hover))]"
                                  >
                                    {m.generation_downloadImage()}
                                  </a>
                                </div>
                                <div className="absolute top-1 left-1 rounded bg-[hsl(var(--background))]/80 backdrop-blur-sm px-1.5 py-0.5 text-xs text-foreground-muted">
                                  {img.variation}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : !isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)]">
                    <ClipboardCheck className="h-8 w-8 text-[hsl(var(--primary))]" aria-hidden="true" />
                  </div>
                  <p className="text-sm text-foreground-muted">{m.generation_previewDesc()}</p>
                </div>
              ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Compare View Modal */}
      {showCompare && (
        <CompareView
          images={generatedResults.flatMap((result, resultIndex) =>
            (result.sceneImages || []).map((img, imgIndex) => ({
              id: img.imageId || `${resultIndex}-${imgIndex}`,
              url: img.url,
              title: result.title,
              generationId: result.id || `${resultIndex}`,
            }))
          )}
          onClose={() => setShowCompare(false)}
        />
      )}
      </div>
    </ToastProvider>
  );
}
