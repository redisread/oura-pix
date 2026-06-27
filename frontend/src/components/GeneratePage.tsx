"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, Upload, Settings, Eye, Check } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import UploadDropzone from "./UploadDropzone";
import GenerationProgress, { type GenerationStage } from "./GenerationProgress";
import CompareView from "./compare/CompareView";
import { uploadImage } from "@/lib/api";
import { createGeneration, getGeneration } from "@/lib/generation";

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
  language: string;
  generateImages: boolean;
  imageCount: number;
  aspectRatio: AspectRatio;
  allowPersons: boolean;
}

export default function GeneratePage() {
  const [mainImage, setMainImage] = useState<File[]>([]);
  const [styleImages, setStyleImages] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>({
    platform: "amazon",
    count: 5,
    style: "minimal",
    language: "zh",
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
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const platforms: { value: Platform; label: string; icon: string }[] = [
    { value: "amazon", label: "Amazon", icon: "A" },
    { value: "shopify", label: "Shopify", icon: "S" },
    { value: "ebay", label: "eBay", icon: "E" },
    { value: "etsy", label: "Etsy", icon: "T" },
    { value: "generic", label: m.common_custom?.() || "自定义", icon: "C" },
  ];

  const styles: { value: Style; label: string; description: string }[] = [
    { value: "minimal", label: m.style_minimal_label?.() || "极简风格", description: m.style_minimal_desc?.() || "简洁干净，突出产品" },
    { value: "luxury", label: m.style_luxury_label?.() || "奢华风格", description: m.style_luxury_desc?.() || "高端大气，彰显品质" },
    { value: "lifestyle", label: m.style_lifestyle_label?.() || "生活风格", description: m.style_lifestyle_desc?.() || "场景融入，情感共鸣" },
    { value: "professional", label: m.style_professional_label?.() || "专业风格", description: m.style_professional_desc?.() || "现代前卫，科技感强" },
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
    const result = await getGeneration(genId);
    if (result.success && result.data) {
      const { status, imageGenerationStatus, results } = result.data;

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
        setGeneratedResults(results);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } else if (status === "failed") {
        setIsGenerating(false);
        setError(result.data.errorMessage || m.generation_failed?.() || "生成失败");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }
  };

  const handleGenerate = async () => {
    if (mainImage.length === 0) {
      setError(m.generation_error_noImage?.() || "请先上传主商品图片");
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
        setError(m.generation_error_uploadFailed?.() || "上传失败");
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
      const generationResult = await createGeneration({
        productImageId: mainImageResult.id,
        referenceImageIds: styleImageIds.length > 0 ? styleImageIds : undefined,
        settings: {
          targetPlatform: settings.platform,
          count: settings.count,
          style: settings.style as "professional" | "lifestyle" | "minimal" | "luxury",
          language: settings.language,
          generateImages: settings.generateImages,
          imageCount: settings.imageCount,
          aspectRatio: settings.aspectRatio,
          allowPersons: settings.allowPersons,
        },
      });

      if (!generationResult.success) {
        setError(generationResult.error || m.generation_error_createFailed?.() || "创建生成任务失败");
        setIsGenerating(false);
        return;
      }

      // Start polling
      pollingRef.current = setInterval(() => {
        if (generationResult.data?.id) {
          pollGenerationStatus(generationResult.data.id);
        }
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : m.generation_error_failed?.() || "生成失败");
      setIsUploading(false);
      setIsGenerating(false);
    }
  };

  const canGenerate = mainImage.length > 0 && !isGenerating && !isUploading;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 bg-[hsl(var(--background))]">
        {/* Header */}
        <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background-secondary))]">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-foreground">{m.generation_title?.() || "生成商品详情"}</h1>
            <p className="mt-1 text-sm text-foreground-muted">
              {m.generation_subtitle?.() || "上传商品图片，AI 将为您生成专业的商品详情页"}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Upload Area */}
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Upload className="h-5 w-5 text-[hsl(var(--primary))]" />
                  <h2 className="text-lg font-semibold text-foreground">{m.generation_uploadSection?.() || "上传图片"}</h2>
                </div>

                <UploadDropzone
                  label={m.generation_mainImage?.() || "主商品图片"}
                  description={m.generation_mainImageDesc?.() || "支持 JPG、PNG、WebP，最大 10MB"}
                  accept="image/*"
                  multiple={false}
                  maxSize={10 * 1024 * 1024}
                  onFilesSelected={handleMainImageSelect}
                  required
                />

                <div className="mt-6">
                  <UploadDropzone
                    label={m.generation_styleImage?.() || "风格参考图"}
                    description={m.generation_styleImageDesc?.() || "可选，最多 3 张"}
                    accept="image/*"
                    multiple
                    maxFiles={3}
                    maxSize={10 * 1024 * 1024}
                    onFilesSelected={handleStyleImagesSelect}
                  />
                </div>
              </div>

              {/* Tips */}
              <div className="card p-4 border-[hsl(var(--primary)/0.2)]">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)]">
                    <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{m.generation_uploadTips?.() || "上传提示"}</h4>
                    <ul className="mt-1 text-sm text-foreground-muted space-y-1">
                      <li>{m.generation_uploadTip1?.() || "使用清晰、高分辨率的商品图片"}</li>
                      <li>{m.generation_uploadTip2?.() || "确保商品主体清晰可见"}</li>
                      <li>{m.generation_uploadTip3?.() || "风格参考图可以帮助 AI 理解您的偏好"}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Settings Panel */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="h-5 w-5 text-[hsl(var(--primary))]" />
                <h2 className="text-lg font-semibold text-foreground">{m.generation_settings?.() || "生成设置"}</h2>
              </div>

              {/* Platform Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  {m.generation_platform?.() || "目标平台"}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, platform: platform.value })}
                      className={`
                        flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all duration-200
                        ${settings.platform === platform.value
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]"
                          : "border-[hsl(var(--border))] hover:border-[hsl(var(--foreground-muted)/0.3)]"
                        }
                      `}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-violet-500 text-sm font-bold text-white">
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
                  {m.generation_count?.() || "生成数量"}
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
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
                <p className="mt-1 text-xs text-foreground-muted">{m.generation_countDesc?.() || "选择要生成的商品详情数量"}</p>
              </div>

              {/* Style Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  {m.generation_style?.() || "风格选择"}
                </label>
                <div className="space-y-2">
                  {styles.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, style: style.value })}
                      className={`
                        w-full flex items-center justify-between rounded-xl border-2 p-3 text-left transition-all duration-200
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
                  {m.generation_outputLang?.() || "输出语言"}
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="input"
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              {/* Image Generation Toggle */}
              <div className="mb-6 rounded-xl border border-[hsl(var(--border))] p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {m.generation_imageGen_title?.() || "生成场景图"}
                    </h3>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      {m.generation_imageGen_desc?.() || "为商品生成多角度展示图"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, generateImages: !settings.generateImages })}
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
                        {m.generation_imageGen_count?.() || "图片数量"}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
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
                        {m.generation_imageGen_aspectRatio?.() || "宽高比"}
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

              {/* Error Message */}
              {error && (
                <div className="mb-4 rounded-xl bg-[hsl(var(--color-error-light))] p-3 text-sm text-[hsl(var(--color-error))]">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`
                  btn-primary w-full h-12 rounded-xl text-base font-medium flex items-center justify-center gap-2
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
                    {m.generation_uploadingBtn?.() || "上传中..."}
                  </>
                ) : isGenerating ? (
                  <>
                    <Sparkles className="h-5 w-5 animate-pulse" />
                    {m.generation_generatingBtn?.() || "生成中..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    {m.generation_generateBtn?.() || "开始生成"}
                  </>
                )}
              </button>
            </div>

            {/* Right: Preview Area */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-[hsl(var(--primary))]" />
                <h2 className="text-lg font-semibold text-foreground">{m.generation_preview?.() || "预览"}</h2>
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
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0" />
                      Demo 模式 — GEMINI_API_KEY 未配置，当前结果为占位数据。配置后可生成真实 AI 文案。
                    </div>
                  )}
                  {/* Compare Button */}
                  {generatedResults.some(r => r.sceneImages && r.sceneImages.length > 1) && (
                    <button
                      type="button"
                      onClick={() => setShowCompare(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[hsl(var(--border))] p-3 text-sm font-medium text-foreground-muted hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                      对比视图（查看所有生成的图片）
                    </button>
                  )}
                  {generatedResults.map((result, resultIndex) => (
                    <div key={result.id || resultIndex} className="rounded-xl border border-[hsl(var(--border))] p-4">
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
                                className="inline-flex items-center rounded-full bg-[hsl(var(--primary)/0.1)] px-2.5 py-0.5 text-xs text-[hsl(var(--primary))]"
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
                            {m.generation_sceneImages?.() || "场景图"} ({result.sceneImages.length})
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {result.sceneImages.map((img: SceneImage, imgIndex: number) => (
                              <div
                                key={img.imageId || imgIndex}
                                className="group relative aspect-square rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary))] overflow-hidden"
                              >
                                <img
                                  src={img.url}
                                  alt={`Scene ${img.variation}`}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[hsl(var(--background))]/80 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm">
                                  <button
                                    type="button"
                                    onClick={() => window.open(img.url, "_blank")}
                                    className="rounded-lg bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-white hover:bg-[hsl(var(--primary-hover))]"
                                  >
                                    {m.generation_viewLarge?.() || "查看大图"}
                                  </button>
                                  <a
                                    href={img.url}
                                    download
                                    className="rounded-lg bg-[hsl(var(--secondary))] px-3 py-1.5 text-xs font-medium text-foreground hover:bg-[hsl(var(--secondary-hover))]"
                                  >
                                    {m.generation_downloadImage?.() || "下载"}
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)] mb-4">
                    <svg className="h-8 w-8 text-[hsl(var(--primary))]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-foreground-muted">{m.generation_previewDesc?.() || "生成结果将显示在这里"}</p>
                </div>
              ) : null}
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
  );
}
