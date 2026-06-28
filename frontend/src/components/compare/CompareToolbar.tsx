/**
 * CompareToolbar Component
 *
 * Toolbar for comparison view controls
 */

import * as m from "@/paraglide/messages.js";
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
  const layouts: { value: LayoutMode; label: string; icon: string }[] = [
    { value: "grid-2x2", label: m.compare_layout2x2(), icon: "⊞" },
    { value: "grid-1x4", label: m.compare_layout1x4(), icon: "☰" },
    { value: "grid-4x1", label: m.compare_layout4x1(), icon: "▤" },
    { value: "single", label: m.compare_layoutSingle(), icon: "□" },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-stone-800 border-b border-stone-700">
      {/* Left: Layout Selection */}
      <div className="flex items-center gap-1">
        {layouts.map((l) => (
          <button
            key={l.value}
            onClick={() => onLayoutChange(l.value)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              layout === l.value
                ? "bg-amber-600 text-white"
                : "bg-stone-700 text-stone-300 hover:bg-stone-600"
            }`}
            title={l.label}
          >
            <span className="mr-1">{l.icon}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </button>
        ))}
      </div>

      {/* Center: Zoom Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          disabled={zoom <= 0.5}
          className="p-1.5 rounded bg-stone-700 text-stone-300 hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={m.compare_zoomOut()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="text-sm text-stone-300 w-12 text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          disabled={zoom >= 5}
          className="p-1.5 rounded bg-stone-700 text-stone-300 hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={m.compare_zoomIn()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={onResetView}
          className="px-2 py-1 text-xs rounded bg-stone-700 text-stone-300 hover:bg-stone-600 transition-colors"
          title={m.compare_reset()}
        >
          {m.compare_reset()}
        </button>
      </div>

      {/* Right: Navigation & Actions */}
      <div className="flex items-center gap-2">
        {/* Image Navigation (for single view) */}
        {layout === "single" && (
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={onPrev}
              disabled={!canPrev}
              className="p-1.5 rounded bg-stone-700 text-stone-300 hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={m.compare_prev()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-stone-300 min-w-[40px] text-center">
              {currentIndex + 1}/{totalImages}
            </span>
            <button
              onClick={onNext}
              disabled={!canNext}
              className="p-1.5 rounded bg-stone-700 text-stone-300 hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title={m.compare_next()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Fullscreen */}
        <button
          onClick={onFullscreen}
          className="p-1.5 rounded bg-stone-700 text-stone-300 hover:bg-stone-600 transition-colors"
          title={isFullscreen ? m.compare_exitFullscreen() : m.compare_fullscreen()}
        >
          {isFullscreen ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>

        {/* Close */}
        <button
          onClick={onClose}
          className="p-1.5 rounded bg-stone-700 text-stone-300 hover:bg-red-600 hover:text-white transition-colors"
          title={m.compare_helpEsc()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
