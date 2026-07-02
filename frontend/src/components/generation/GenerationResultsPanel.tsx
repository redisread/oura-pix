import type { GenerationStage } from "../GenerationProgress";
import GenerationProgress from "../GenerationProgress";
import type { GeneratedResult, SceneImage } from "../GeneratePage";
import * as m from "@/paraglide/messages.js";
import { Eye, Sparkles, ClipboardCheck } from "lucide-react";

interface GenerationResultsPanelProps {
  results: GeneratedResult[];
  loading: boolean;
  onCompare: () => void;
  stage: GenerationStage;
  progress: number;
}

export default function GenerationResultsPanel({
  results,
  loading,
  onCompare,
  stage,
  progress,
}: GenerationResultsPanelProps) {
  return (
    <div className="card overflow-hidden">
      <div className="proof-strip h-1.5" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-[hsl(var(--primary))]" />
          <h2 className="text-lg font-semibold text-foreground">{m.generation_preview()}</h2>
        </div>

        {/* Progress */}
        {loading && (
          <div className="mb-6">
            <GenerationProgress
              stage={stage}
              progress={progress}
              currentImageCount={0}
              totalImageCount={0}
            />
          </div>
        )}

        {/* Results Display */}
        {results.length > 0 ? (
          <div className="space-y-6">
            {/* Demo Mode Banner */}
            {results.some((r) => r.metadata?.mock) && (
              <div className="flex items-center gap-2 rounded-lg border border-[hsl(var(--accent)/0.32)] bg-[hsl(var(--accent)/0.1)] p-3 text-sm font-medium text-[hsl(var(--accent))]">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                {m.generation_demoMode()}
              </div>
            )}
            {/* Compare Button */}
            {results.some((r) => r.sceneImages && r.sceneImages.length > 1) && (
              <button
                type="button"
                onClick={onCompare}
                className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[hsl(var(--border))] p-3 text-sm font-semibold text-foreground-muted transition-colors hover:border-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                {m.compare_buttonDesc()}
              </button>
            )}
            {results.map((result, resultIndex) => (
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
        ) : !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)]">
              <ClipboardCheck className="h-8 w-8 text-[hsl(var(--primary))]" aria-hidden="true" />
            </div>
            <p className="text-sm text-foreground-muted">{m.generation_previewDesc()}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
