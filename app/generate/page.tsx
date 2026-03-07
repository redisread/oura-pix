"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import UploadDropzone from "../components/upload-dropzone";
import { uploadImage } from "../actions/upload-image";
import { createGeneration } from "../actions/create-generation";
import { getGeneration } from "../actions/get-generation";
import GenerationProgress, { type GenerationStage } from "../components/generation-progress";

type Platform = "amazon" | "shopify" | "ebay" | "etsy" | "generic";
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
  const t = useTranslations("generation");
  const tCommon = useTranslations("common");
  const tImageGen = useTranslations("generation.imageGeneration");

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
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const platforms: { value: Platform; label: string; icon: string }[] = [
    { value: "amazon", label: "Amazon", icon: "A" },
    { value: "shopify", label: "Shopify", icon: "S" },
    { value: "ebay", label: "eBay", icon: "E" },
    { value: "etsy", label: "Etsy", icon: "T" },
    { value: "generic", label: tCommon("custom") || "自定义", icon: "C" },
  ];

  const styles: { value: Style; label: string; description: string }[] = [
    { value: "minimal", label: t("styles.minimal.label") || "极简风格", description: t("styles.minimal.desc") || "简洁干净，突出产品" },
    { value: "luxury", label: t("styles.luxury.label") || "奢华风格", description: t("styles.luxury.desc") || "高端大气，彰显品质" },
    { value: "lifestyle", label: t("styles.lifestyle.label") || "生活风格", description: t("styles.lifestyle.desc") || "场景融入，情感共鸣" },
    { value: "professional", label: t("styles.tech.label") || "专业风格", description: t("styles.tech.desc") || "现代前卫，科技感强" },
  ];

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // 上传主图片
  const uploadMainImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "product");

    const result = await uploadImage(formData);
    if (result.success && result.data) {
      return result.data.id;
    }
    setError(result.error || "上传失败");
    return null;
  };

  // 上传风格参考图
  const uploadStyleImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "reference");

    const result = await uploadImage(formData);
    if (result.success && result.data) {
      return result.data.id;
    }
    return null;
  };

  const handleMainImageSelect = useCallback((files: File[]) => {
    setMainImage(files);
    setError(null);
  }, []);

  const handleStyleImagesSelect = useCallback((files: File[]) => {
    setStyleImages(files);
    setError(null);
  }, []);

  // 轮询生成状态
  const pollGenerationStatus = async (genId: string) => {
    const result = await getGeneration(genId);
    if (result.success && result.data) {
      const { status, imageGenerationStatus, results, generatedImageCount } = result.data;

      // 根据状态更新进度和阶段
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
        setError(result.data.errorMessage || "生成失败");
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }
  };

  const handleGenerate = async () => {
    if (mainImage.length === 0) {
      setError(t("errors.noImage") || "请先上传主商品图片");
      return;
    }

    setError(null);
    setIsUploading(true);
    setProgress(0);
    setCurrentStage("analyzing");
    setGeneratedResults([]);

    try {
      // 1. 上传主商品图片
      const mainImageId = await uploadMainImage(mainImage[0]);
      if (!mainImageId) {
        setIsUploading(false);
        return;
      }

      // 2. 上传风格参考图
      const styleImageIds: string[] = [];
      for (const file of styleImages) {
        const id = await uploadStyleImage(file);
        if (id) {
          styleImageIds.push(id);
        }
      }

      setIsUploading(false);
      setIsGenerating(true);

      // 3. 创建生成任务
      const generationResult = await createGeneration({
        productImageId: mainImageId,
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
        setError(generationResult.error || "创建生成任务失败");
        setIsGenerating(false);
        return;
      }

      // 4. 开始轮询状态
      pollingRef.current = setInterval(() => {
        pollGenerationStatus(generationResult.data!.id);
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
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
            <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {t("subtitle")}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Upload Area */}
            <div className="space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-900">{t("uploadSection")}</h2>

                {/* Main Image Upload */}
                <UploadDropzone
                  label={t("mainImage")}
                  description={t("mainImageDesc")}
                  accept="image/*"
                  multiple={false}
                  maxSize={10 * 1024 * 1024}
                  onFilesSelected={handleMainImageSelect}
                  required
                />

                {/* Style Reference Images */}
                <div className="mt-6">
                  <UploadDropzone
                    label={t("styleImage")}
                    description={t("styleImageDesc")}
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
                    <h4 className="text-sm font-medium text-blue-900">{t("uploadTips")}</h4>
                    <ul className="mt-1 text-sm text-blue-700 space-y-1">
                      <li>{t("uploadTip1")}</li>
                      <li>{t("uploadTip2")}</li>
                      <li>{t("uploadTip3")}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: Settings Panel */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-lg font-semibold text-slate-900">{t("settings")}</h2>

              {/* Platform Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {t("platform")}
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
                  {t("count")}
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
                <p className="mt-1 text-xs text-slate-500">{t("countDesc")}</p>
              </div>

              {/* Style Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  {t("style")}
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
                  {t("outputLang")}
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

              {/* Image Generation Settings */}
              <div className="mb-6 rounded-lg border-2 border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {tImageGen("title")}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {tImageGen("enableDesc")}
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
                    {/* Image Count */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">
                        {tImageGen("count")}
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
                      <p className="mt-1 text-xs text-slate-500">{tImageGen("countDesc")}</p>
                    </div>

                    {/* Aspect Ratio */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-2">
                        {tImageGen("aspectRatio")}
                      </label>
                      <select
                        value={settings.aspectRatio}
                        onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as AspectRatio })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="1:1">{tImageGen("ratios.1:1")}</option>
                        <option value="3:4">{tImageGen("ratios.3:4")}</option>
                        <option value="4:3">{tImageGen("ratios.4:3")}</option>
                        <option value="9:16">{tImageGen("ratios.9:16")}</option>
                        <option value="16:9">{tImageGen("ratios.16:9")}</option>
                      </select>
                      <p className="mt-1 text-xs text-slate-500">{tImageGen("aspectRatioDesc")}</p>
                    </div>

                    {/* Allow Persons */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-medium text-slate-700">
                          {tImageGen("allowPersons")}
                        </label>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {tImageGen("allowPersonsDesc")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, allowPersons: !settings.allowPersons })}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                          ${settings.allowPersons ? "bg-slate-900" : "bg-slate-300"}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-3 w-3 transform rounded-full bg-white transition-transform
                            ${settings.allowPersons ? "translate-x-5" : "translate-x-1"}
                          `}
                        />
                      </button>
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
                {isUploading ? (t("uploadingBtn") || "上传中...") : isGenerating ? t("generatingBtn") : t("generateBtn")}
              </button>
            </div>

            {/* Right: Preview Area */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">{t("preview")}</h2>

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
                    <div key={result.id} className="rounded-lg border border-slate-200 p-4">
                      {/* Text Content */}
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

                      {/* Scene Images Grid */}
                      {result.sceneImages && result.sceneImages.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-slate-700 mb-2">
                            {tImageGen("results.sceneImages")} ({result.sceneImages.length})
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            {result.sceneImages.map((img: any, imgIndex: number) => (
                              <div
                                key={img.imageId}
                                className="group relative aspect-square rounded-lg border border-slate-200 bg-slate-50 overflow-hidden"
                              >
                                <img
                                  src={img.url}
                                  alt={`${tImageGen("results.variation", { number: img.variation })}`}
                                  className="h-full w-full object-cover"
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/70 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => window.open(img.url, "_blank")}
                                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
                                  >
                                    {tImageGen("results.viewLarge")}
                                  </button>
                                  <a
                                    href={img.url}
                                    download
                                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
                                  >
                                    {tImageGen("results.downloadImage")}
                                  </a>
                                </div>
                                {/* Variation Badge */}
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
                // Empty State
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <svg
                    className="h-12 w-12 text-slate-300 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-slate-600">{t("previewDesc")}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
