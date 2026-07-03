/**
 * CollageMaker Tool Component
 *
 * Combine multiple images into a single collage via Canvas API.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ImagePlus, X } from "lucide-react";
import {
  getLayoutLabel,
  LAYOUTS,
  useImageCollage,
  type CollageCell,
  type LayoutTemplate,
} from "@/hooks/useImageCollage";
import * as m from "@/paraglide/messages.js";
import { ToolPageLayout } from "./ToolPageLayout";

export default function CollageMaker() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    options,
    setOptions,
    cells,
    addImage,
    removeCell,
    updateCell,
    canvasRef,
    render,
    exporting,
    download,
  } = useImageCollage();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Live preview
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const blob = await render();
      if (cancelled || !blob) return;
      const url = URL.createObjectURL(blob);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
    };
    const t = setTimeout(tick, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, cells]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((f) => {
      if (f.type.startsWith("image/")) addImage(f);
    });
  };

  const filledCount = cells.filter((c) => c.imageUrl).length;

  return (
    <ToolPageLayout
      kicker={m.tool_collageKicker()}
      title={m.tool_collageTitle()}
      subtitle={m.tool_collageSubtitle()}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="panel space-y-4 p-4">
            <h2 className="panel-title">{m.tool_layout()}</h2>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LAYOUTS) as LayoutTemplate[]).map((key) => (
              <button
                key={key}
                onClick={() => setOptions({ ...options, layout: key })}
                  className={`segmented-option ${options.layout === key ? "segmented-option-active" : ""}`}
              >
                {getLayoutLabel(key)}
              </button>
            ))}
          </div>

            <h2 className="panel-title border-t border-[hsl(var(--border))] pt-4">{m.tool_outputSize()}</h2>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={String(options.outputWidth)}
              onChange={(e) => setOptions({ ...options, outputWidth: Number(e.target.value), outputHeight: Number(e.target.value) })}
                className="input py-1.5"
            >
              <option value="1080">1080×1080</option>
              <option value="720">720×720</option>
              <option value="1440">1440×1440</option>
            </select>
            <input
              type="color"
              value={options.backgroundColor}
              onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
                className="swatch"
                aria-label={m.tool_collageBackgroundAria()}
            />
          </div>

          <div>
              <div className="mb-1 flex justify-between text-xs font-medium text-foreground-muted">
              <span>{m.tool_gap()}</span>
              <span>{options.gap}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={options.gap}
              onChange={(e) => setOptions({ ...options, gap: Number(e.target.value) })}
                className="range"
                aria-label={m.tool_collageGapAria()}
            />
          </div>

          <div>
              <div className="mb-1 flex justify-between text-xs font-medium text-foreground-muted">
              <span>{m.tool_borderRadius()}</span>
              <span>{options.borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={options.borderRadius}
              onChange={(e) => setOptions({ ...options, borderRadius: Number(e.target.value) })}
                className="range"
                aria-label={m.tool_collageRadiusAria()}
            />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
              className="btn-primary h-10 w-full gap-2"
          >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {m.tool_addImagesCount({ filled: filledCount.toString(), total: cells.length.toString() })}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id="collage-input"
          />
          <button
            onClick={download}
            disabled={filledCount === 0 || exporting}
              className="btn-secondary h-10 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
              <Download className="h-4 w-4" aria-hidden="true" />
            {exporting ? m.tool_exporting() : m.tool_downloadPng()}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-4">
            <div className="panel p-4">
              <div className="panel-muted flex min-h-[400px] items-center justify-center">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[600px]"
                style={{ display: "none" }}
              />
              {previewUrl ? (
                <img src={previewUrl} alt={m.tool_preview()} className="max-w-full max-h-[600px] object-contain" loading="lazy" decoding="async" />
              ) : (
                  <p className="p-12 text-sm font-medium text-foreground-muted">{m.tool_collageEmpty()}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {cells.map((cell, idx) => (
              <CellEditor key={idx} index={idx} cell={cell} onUpdate={(p) => updateCell(idx, p)} onRemove={() => removeCell(idx)} />
            ))}
          </div>
        </div>
      </div>
      </ToolPageLayout>
  );
}

function CellEditor({
  index,
  cell,
  onUpdate,
  onRemove,
}: {
  index: number;
  cell: CollageCell;
  onUpdate: (p: Partial<CollageCell>) => void;
  onRemove: () => void;
}) {
  if (!cell.imageUrl) {
    return (
      <div className="panel-muted flex aspect-square items-center justify-center font-utility text-xs text-foreground-muted">
        #{index + 1}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="group relative aspect-square overflow-hidden rounded-md bg-[hsl(var(--secondary))]">
        <img src={cell.imageUrl} alt={`Cell ${index + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
        <button
          onClick={onRemove}
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-[hsl(var(--color-error))] text-white opacity-0 transition-opacity group-hover:opacity-100"
          aria-label={m.tool_collageRemoveImageAria({ index: (index + 1).toString() })}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <span className="w-6 text-[10px] text-foreground-muted">{m.tool_scale()}</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={cell.scale}
            onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
            className="range flex-1"
            aria-label={m.tool_collageScaleImageAria({ index: (index + 1).toString() })}
          />
        </div>
      </div>
    </div>
  );
}
