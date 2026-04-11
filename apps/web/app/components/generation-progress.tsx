"use client";

import { useTranslations } from "next-intl";

export type GenerationStage = "analyzing" | "generating_text" | "generating_images" | "uploading" | "completed";

interface GenerationProgressProps {
  stage: GenerationStage;
  progress: number;
  currentImageCount?: number;
  totalImageCount?: number;
}

export default function GenerationProgress({
  stage,
  progress,
  currentImageCount = 0,
  totalImageCount = 0,
}: GenerationProgressProps) {
  const t = useTranslations("generation.imageGeneration.stages");

  const getStageText = () => {
    switch (stage) {
      case "analyzing":
        return t("analyzing");
      case "generating_text":
        return t("generatingText");
      case "generating_images":
        return t("generatingImages", { current: currentImageCount, total: totalImageCount });
      case "uploading":
        return t("uploading");
      case "completed":
        return t("completed");
      default:
        return "";
    }
  };

  const stages = [
    { key: "analyzing", label: "分析图片" },
    { key: "generating_text", label: "生成文案" },
    { key: "generating_images", label: "生成场景图" },
    { key: "uploading", label: "上传结果" },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === stage);

  return (
    <div className="space-y-4">
      {/* Stage Indicators */}
      <div className="flex items-center justify-between">
        {stages.map((stageItem, index) => {
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;

          return (
            <div key={stageItem.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                {/* Circle */}
                <div
                  className={`
                    flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all
                    ${isCompleted
                      ? "border-slate-900 bg-slate-900"
                      : isActive
                      ? "border-slate-900 bg-white"
                      : "border-slate-300 bg-white"
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span
                      className={`
                        text-xs font-semibold
                        ${isActive ? "text-slate-900" : "text-slate-400"}
                      `}
                    >
                      {index + 1}
                    </span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={`
                    mt-2 text-xs text-center
                    ${isActive || isCompleted ? "text-slate-900 font-medium" : "text-slate-500"}
                  `}
                >
                  {stageItem.label}
                </span>
              </div>
              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div
                  className={`
                    h-0.5 flex-1 -mt-6 transition-colors
                    ${isCompleted ? "bg-slate-900" : "bg-slate-300"}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">{getStageText()}</span>
          <span className="text-sm font-medium text-slate-900">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-2 rounded-full bg-slate-900 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Current Stage Description */}
      {stage === "generating_images" && totalImageCount > 0 && (
        <div className="rounded-lg bg-blue-50 p-3">
          <div className="flex items-start gap-2">
            <svg
              className="h-5 w-5 text-blue-600 mt-0.5 shrink-0 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">正在生成场景图</p>
              <p className="text-xs text-blue-700 mt-1">
                AI 正在为您的商品创建多角度展示图，请稍候...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
