"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import UploadDropzone from "../components/upload-dropzone";
import { uploadImage } from "../actions/upload-image";
import { createGeneration } from "../actions/create-generation";
import { getGeneration } from "../actions/get-generation";

type Platform = "amazon" | "shopify" | "ebay" | "etsy" | "generic";
type Style = "minimal" | "luxury" | "lifestyle" | "professional";

interface UploadedImageInfo {
  id: string;
  url: string;
}

interface GenerationSettings {
  platform: Platform;
  count: number;
  style: Style;
  language: string;
}

export default function GeneratePage() {
  const t = useTranslations("generation");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [mainImage, setMainImage] = useState<File[]>([]);
  const [styleImages, setStyleImages] = useState<File[]>([]);
  const [uploadedMainImageId, setUploadedMainImageId] = useState<string | null>(null);
  const [uploadedStyleImageIds, setUploadedStyleImageIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>({
    platform: "amazon",
    count: 5,
    style: "minimal",
    language: "zh",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generationId, setGenerationId] = useState<string | null>(null);
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
    setUploadedMainImageId(null);
    setError(null);
  }, []);

  const handleStyleImagesSelect = useCallback((files: File[]) => {
    setStyleImages(files);
    setUploadedStyleImageIds([]);
    setError(null);
  }, []);

  // 轮询生成状态
  const pollGenerationStatus = async (genId: string) => {
    const result = await getGeneration(genId);
    if (result.success && result.data) {
      const { status, progress: apiProgress, results } = result.data;

      setProgress(apiProgress || 0);

      if (status === "completed" && results) {
        setIsGenerating(false);
        setGeneratedImages(results.map(r => r.imageUrl || "").filter(Boolean));
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
    setGeneratedImages([]);

    try {
      // 1. 上传主商品图片
      const mainImageId = await uploadMainImage(mainImage[0]);
      if (!mainImageId) {
        setIsUploading(false);
        return;
      }
      setUploadedMainImageId(mainImageId);

      // 2. 上传风格参考图
      const styleImageIds: string[] = [];
      for (const file of styleImages) {
        const id = await uploadStyleImage(file);
        if (id) {
          styleImageIds.push(id);
        }
      }
      setUploadedStyleImageIds(styleImageIds);

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
        },
      });

      if (!generationResult.success) {
        setError(generationResult.error || "创建生成任务失败");
        setIsGenerating(false);
        return;
      }

      setGenerationId(generationResult.data!.id);

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
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">{t("progress")}</span>
                    <span className="text-sm font-medium text-slate-900">{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-900 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {t("eta")}
                  </p>
                </div>
              )}

              {/* Preview Grid */}
              <div className="grid grid-cols-2 gap-3">
                {generatedImages.length > 0 ? (
                  generatedImages.map((image, index) => (
                    <div key={index} className="group relative aspect-[3/4] rounded-lg border border-slate-200 bg-slate-50 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                        <div className="text-center">
                          <svg className="mx-auto h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs">{tCommon("image") || "图片"} {index + 1}</span>
                        </div>
                      </div>
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <button className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-100">
                          {tCommon("download") || "下载"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  // Empty State
                  Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="aspect-[3/4] rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center"
                    >
                      <span className="text-xs text-slate-400">{tCommon("preview") || "预览"} {index + 1}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Download All Button */}
              {generatedImages.length > 0 && (
                <button
                  type="button"
                  className="mt-4 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {tCommon("downloadAll") || "下载全部"} ({generatedImages.length} {tCommon("images") || "张"})
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
