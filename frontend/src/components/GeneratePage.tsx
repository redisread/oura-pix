"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import * as m from "@/paraglide/messages.js";
import UploadDropzone from "./UploadDropzone";
import GenerationProgress, { type GenerationStage } from "./GenerationProgress";
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
      <main className="flex-1 bg-slate-50">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-slate-900">{m.generation_title?.() || "生成商品详情"}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {m.generation_subtitle?.() || "上传商品图片，AI 将为您生成专业的商品详情页"}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Upload Area */}
            <div className="space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">{m.generation_uploadSection?.() || "上传图片"}</h2>

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
              <div className="rounded-xl bg-blue-50 p-4">
                <div className="flex gap-3">
                  <svg className="h-5 w-5 shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">{m.generation_uploadTips?.() || "上传提示"}</h4>
                    <ul className="mt-1 text-sm text-blue-700 space-y-1">
                      <li>{m.generation_uploadTip1?.() || "使用清晰、高分辨率的商品图片"}</li>
                      <li>{m.generation_uploadTip2?.() || "确保商品主体清晰可见"}</li>
                      <li>{m.generation_uploadTip3?.() || "风格参考图可以帮助 AI 理解您的偏好"}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Settings Panel */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-slate-900">{m.generation_settings?.() || "生成设置"}</h2>

              {/* Platform Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {m.generation_platform?.() || "目标平台"}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, platform: platform.value })}
                      className={`
                        flex flex-col items-center justify-center rounded-lg border-2 p-4 transition-all
                        ${settings.platform === platform.value
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                        }
                      `}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                        {platform.icon}
                      </span>
                      <span className="mt-2 text-sm font-medium text-slate-700">
                        {platform.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generation Count */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
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
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                  />
                  <span className="w-12 text-center text-lg font-semibold text-slate-900">
                    {settings.count}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{m.generation_countDesc?.() || "选择要生成的商品详情数量"}</p>
              </div>

              {/* Style Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {m.generation_style?.() || "风格选择"}
                </label>
                <div className="space-y-2">
                  {styles.map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setSettings({ ...settings, style: style.value })}
                      className={`
                        w-full flex items-center justify-between rounded-lg border-2 p-3 text-left transition-all
                        ${settings.style === style.value
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 hover:border-slate-300"
                        }
                      `}
                    >
                      <div>
                        <span className="block text-sm font-medium text-slate-900">
                          {style.label}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {style.description}
                        </span>
                      </div>
                      {settings.style === style.value && (
                        <svg className="h-5 w-5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {m.generation_outputLang?.() || "输出语言"}
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                  <option value="ja">日本語</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              {/* Image Generation Toggle */}
              <div className="mb-6 rounded-lg border-2 border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {m.generation_imageGen_title?.() || "生成场景图"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {m.generation_imageGen_desc?.() || "为商品生成多角度展示图"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, generateImages: !settings.generateImages })}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${settings.generateImages ? "bg-slate-900" : "bg-slate-300"}
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                        ${settings.generateImages ? "translate-x-6" : "translate-x-1"}
                      `}
                    />
                  </button>
                </div>

                {settings.generateImages && (
                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">
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
                          className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                        />
                        <span className="w-8 text-center text-sm font-semibold text-slate-900">
                          {settings.imageCount}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">
                        {m.generation_imageGen_aspectRatio?.() || "宽高比"}
                      </label>
                      <select
                        value={settings.aspectRatio}
                        onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as AspectRatio })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                className={`
                  w-full rounded-lg px-4 py-3 text-base font-medium transition-all
                  ${canGenerate
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }
                `}
              >
                {isUploading
                  ? m.generation_uploadingBtn?.() || "上传中..."
                  : isGenerating
                    ? m.generation_generatingBtn?.() || "生成中..."
                    : m.generation_generateBtn?.() || "开始生成"}
              </button>
            </div>

            {/* Right: Preview Area */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">{m.generation_preview?.() || "预览"}</h2>

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
                  {generatedResults.map((result, resultIndex) => (
                    <div key={result.id || resultIndex} className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-slate-900 mb-2">
                          {result.title}
                        </h3>
                        <p className="text-sm text-slate-600 line-clamp-3">
                          {result.description}
                        </p>
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {result.tags.slice(0, 5).map((tag: string, tagIndex: number) => (
                              <span
                                key={tagIndex}
                                className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {result.sceneImages && result.sceneImages.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-slate-700 mb-2">
                            {"场景图"} ({result.sceneImages.length})
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {result.sceneImages.map((img: { imageId?: string; url: string; variation?: number }, imgIndex: number) => (
                              <div
                                key={img.imageId || imgIndex}
                                className="group relative aspect-square rounded-lg border border-slate-200 bg-slate-50 overflow-hidden"
                              >
                                <img
                                  src={img.url}
                                  alt={`Scene ${img.variation}`}
                                  className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/70 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => window.open(img.url, "_blank")}
                                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
                                  >
                                    {m.generation_viewLarge?.() || "查看大图"}
                                  </button>
                                  <a
                                    href={img.url}
                                    download
                                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
                                  >
                                    {m.generation_downloadImage?.() || "下载"}
                                  </a>
                                </div>
                                <div className="absolute top-1 left-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-xs text-white">
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
                  <svg className="h-12 w-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-slate-600">{m.generation_previewDesc?.() || "生成结果将显示在这里"}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
