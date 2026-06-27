/**
 * CompareToolbar Component
 *
 * Toolbar for comparison view controls
 */

import {
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Maximize2,
  Minimize2,
  PanelTop,
  PanelRight,
  RotateCcw,
  Square,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ComponentType } from "react";
import type { LayoutMode } from "@/hooks/useCompare";

interface CompareToolbarProps {
  layout: LayoutMode;
  onLayoutChange: (layout: LayoutMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  currentIndex: number;
  totalImages: number;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  onClose: () => void;
}

const layouts: { value: LayoutMode; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: "grid-2x2", label: "2×2", icon: Grid2X2 },
  { value: "grid-1x4", label: "1×4", icon: PanelTop },
  { value: "grid-4x1", label: "4×1", icon: PanelRight },
  { value: "single", label: "单图", icon: Square },
];

export default function CompareToolbar({
  layout,
  onLayoutChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFullscreen,
  isFullscreen,
  currentIndex,
  totalImages,
  onPrev,
  onNext,
  canPrev,
  canNext,
  onClose,
}: CompareToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2">
      <div className="flex items-center gap-1">
        {layouts.map((l) => {
          const Icon = l.icon;
          return (
            <button
              key={l.value}
              onClick={() => onLayoutChange(l.value)}
              className={`segmented-option ${layout === l.value ? "segmented-option-active" : ""}`}
              title={l.label}
              aria-label={l.label}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{l.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          disabled={zoom <= 0.5}
          className="icon-button h-8 w-8 disabled:cursor-not-allowed disabled:opacity-50"
          title="缩小"
          aria-label="缩小"
        >
          <ZoomOut className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="font-utility w-12 text-center text-sm text-foreground-muted">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          disabled={zoom >= 5}
          className="icon-button h-8 w-8 disabled:cursor-not-allowed disabled:opacity-50"
          title="放大"
          aria-label="放大"
        >
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          onClick={onResetView}
          className="btn-secondary h-8 gap-1 px-2 text-xs"
          title="重置视图"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          重置
        </button>
      </div>

      <div className="flex items-center gap-2">
        {layout === "single" && (
          <div className="mr-2 flex items-center gap-1">
            <button
              onClick={onPrev}
              disabled={!canPrev}
              className="icon-button h-8 w-8 disabled:cursor-not-allowed disabled:opacity-50"
              title="上一张"
              aria-label="上一张"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="font-utility min-w-[40px] text-center text-sm text-foreground-muted">
              {currentIndex + 1}/{totalImages}
            </span>
            <button
              onClick={onNext}
              disabled={!canNext}
              className="icon-button h-8 w-8 disabled:cursor-not-allowed disabled:opacity-50"
              title="下一张"
              aria-label="下一张"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <button
          onClick={onFullscreen}
          className="icon-button h-8 w-8"
          title={isFullscreen ? "退出全屏" : "全屏"}
          aria-label={isFullscreen ? "退出全屏" : "全屏"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" aria-hidden="true" /> : <Maximize2 className="h-4 w-4" aria-hidden="true" />}
        </button>

        <button
          onClick={onClose}
          className="icon-button h-8 w-8 hover:text-[hsl(var(--color-error))]"
          title="关闭 (ESC)"
          aria-label="关闭"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
