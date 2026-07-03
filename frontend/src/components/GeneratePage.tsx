"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, Upload } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { getLocale } from "@/paraglide/runtime.js";
import { localeToGenerationLanguage, type Locale } from "@oura-pix/i18n";
import UploadDropzone from "./UploadDropzone";
import type { GenerationStage } from "./GenerationProgress";
import CompareView from "./compare/CompareView";
import GenerationResultsPanel from "./generation/GenerationResultsPanel";
import GenerationSettingsPanel from "./generation/GenerationSettingsPanel";
import { uploadImage } from "@/lib/api";
import type { GenerationSettings } from "./generation/GenerationSettingsPanel";
import { createGeneration, getGeneration, previewGeneration } from "@/lib/api";
import { useToast, ToastProvider } from "./ui/Toast";

export interface SceneImage {
  imageId?: string;
  url: string;
  aspectRatio?: string;
  width?: number;
  height?: number;
  promptUsed?: string;
  variation?: number;
}

export interface GeneratedResult {
  id?: string;
  title?: string;
  description?: string;
  tags?: string[];
  imageUrl?: string;
  confidenceScore?: number;
  sceneImages?: SceneImage[];
  metadata?: Record<string, unknown>;
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
      toast.success(m.generate_complete());
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    } else if (status === "failed") {
      setIsGenerating(false);
      setError(m.generation_failed());
      toast.error(m.generate_failed(), {
        action: {
          label: m.common_retry(),
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

            <GenerationSettingsPanel
              settings={settings}
              onSettingsChange={setSettings}
              promptText={promptText}
              onPromptTextChange={setPromptText}
              onPreview={handlePreview}
              onGenerate={handleGenerate}
              onClearPreview={() => setPreviewResult(null)}
              isPreviewing={isPreviewing}
              isUploading={isUploading}
              isGenerating={isGenerating}
              canGenerate={canGenerate}
              error={error}
              previewResult={previewResult}
            />

            <GenerationResultsPanel
              results={generatedResults}
              loading={isGenerating}
              onCompare={() => setShowCompare(true)}
              stage={currentStage}
              progress={progress}
            />
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
