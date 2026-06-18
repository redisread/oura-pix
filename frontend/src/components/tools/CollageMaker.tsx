/**
 * CollageMaker Tool Component
 *
 * Combine multiple images into a single collage via Canvas API.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useImageCollage, LAYOUTS, type LayoutTemplate, type CollageCell } from "@/hooks/useImageCollage";

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">图片拼图</h1>
        <p className="text-sm text-slate-500 mt-1">
          浏览器内多图组合，导出 PNG
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Options */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4">
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">布局</h2>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(LAYOUTS) as LayoutTemplate[]).map((key) => (
              <button
                key={key}
                onClick={() => setOptions({ ...options, layout: key })}
                className={`px-2 py-2 text-xs rounded ${
                  options.layout === key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {LAYOUTS[key].label}
              </button>
            ))}
          </div>

          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">输出尺寸</h2>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={String(options.outputWidth)}
              onChange={(e) => setOptions({ ...options, outputWidth: Number(e.target.value), outputHeight: Number(e.target.value) })}
              className="px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
            >
              <option value="1080">1080×1080</option>
              <option value="720">720×720</option>
              <option value="1440">1440×1440</option>
            </select>
            <input
              type="color"
              value={options.backgroundColor}
              onChange={(e) => setOptions({ ...options, backgroundColor: e.target.value })}
              className="w-full h-8 border border-slate-200 dark:border-slate-700 rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>间距</span>
              <span>{options.gap}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={options.gap}
              onChange={(e) => setOptions({ ...options, gap: Number(e.target.value) })}
              className="w-full accent-slate-900"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>圆角</span>
              <span>{options.borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={options.borderRadius}
              onChange={(e) => setOptions({ ...options, borderRadius: Number(e.target.value) })}
              className="w-full accent-slate-900"
            />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
          >
            添加图片 ({filledCount}/{cells.length})
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
            className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            {exporting ? "导出中..." : "下载 PNG"}
          </button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded min-h-[400px]">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[600px]"
                style={{ display: "none" }}
              />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-[600px] object-contain" />
              ) : (
                <p className="text-slate-400 p-12">添加图片开始</p>
              )}
            </div>
          </div>

          {/* Cell editor */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {cells.map((cell, idx) => (
              <CellEditor key={idx} index={idx} cell={cell} onUpdate={(p) => updateCell(idx, p)} onRemove={() => removeCell(idx)} />
            ))}
          </div>
        </div>
      </div>
    </div>
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
      <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-400 text-xs">
        #{index + 1}
      </div>
    );
  }
  return (
    <div className="space-y-1">
      <div className="aspect-square rounded overflow-hidden bg-slate-100 dark:bg-slate-800 relative group">
        <img src={cell.imageUrl} alt={`Cell ${index + 1}`} className="w-full h-full object-cover" />
        <button
          onClick={onRemove}
          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100"
        >
          ✕
        </button>
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-500 w-6">缩放</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={cell.scale}
            onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
            className="flex-1 accent-slate-900"
          />
        </div>
      </div>
    </div>
  );
}
