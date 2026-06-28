"use client";

import { Check, Loader2 } from "lucide-react";
import * as m from "@/paraglide/messages.js";

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
  const getStageText = () => {
    switch (stage) {
      case "analyzing":
        return m.generation_stage_analyzing();
      case "generating_text":
        return m.generation_stage_generatingText();
      case "generating_images":
        return m.generation_stage_generatingImages({
          current: currentImageCount.toString(),
          total: totalImageCount.toString(),
        });
      case "uploading":
        return m.generation_stage_uploading();
      case "completed":
        return m.generation_stage_completed();
      default:
        return "";
    }
  };

  const stages = [
    { key: "analyzing", label: m.generation_stageLabel_analyzing() },
    { key: "generating_text", label: m.generation_stageLabel_generatingText() },
    { key: "generating_images", label: m.generation_stageLabel_generatingImages() },
    { key: "uploading", label: m.generation_stageLabel_uploading() },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === stage);

  return (
    <div className="space-y-4">
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
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
                      : isActive
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--card))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 text-white" aria-hidden="true" />
                  ) : (
                    <span
                      className={`
                        text-xs font-semibold
                        ${isActive ? "text-[hsl(var(--primary))]" : "text-foreground-muted"}
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
                    ${isActive || isCompleted ? "font-semibold text-foreground" : "text-foreground-muted"}
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
                    ${isCompleted ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--border))]"}
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
          <span className="text-sm text-foreground-muted">{getStageText()}</span>
          <span className="font-utility text-sm font-semibold text-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
          <div
            className="h-2 rounded-full bg-[hsl(var(--primary))] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {stage === "generating_images" && totalImageCount > 0 && (
        <div className="info-banner">
          <div className="flex items-start gap-2">
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{m.generation_generatingSceneImages()}</p>
              <p className="mt-1 text-xs">
                {m.generation_aiCreatingImages()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
