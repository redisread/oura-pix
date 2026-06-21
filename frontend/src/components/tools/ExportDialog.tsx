/**
 * ExportDialog Component
 *
 * Reusable export dialog: choose format (PNG/JPG/WebP), quality, and size preset.
 * Outputs a single file with the chosen settings.
 */

"use client";

import { useState } from "react";

export type ExportFormat = "image/png" | "image/jpeg" | "image/webp";

export interface SizePreset {
  label: string;
  width: number;
  height: number;
}

const DEFAULT_PRESETS: SizePreset[] = [
  { label: "原图", width: 0, height: 0 },
  { label: "Amazon 主图 (2000×2000)", width: 2000, height: 2000 },
  { label: "Shopify (2048×2048)", width: 2048, height: 2048 },
  { label: "eBay (1600×1600)", width: 1600, height: 1600 },
  { label: "Instagram 1:1 (1080×1080)", width: 1080, height: 1080 },
  { label: "Instagram 4:5 (1080×1350)", width: 1080, height: 1350 },
  { label: "小红书 3:4 (1080×1440)", width: 1080, height: 1440 },
  { label: "抖音小店 (750×1000)", width: 750, height: 1000 },
];

const FORMAT_LABELS: Record<ExportFormat, string> = {
  "image/png": "PNG (透明背景)",
  "image/jpeg": "JPEG (小文件)",
  "image/webp": "WebP (现代压缩)",
};

export interface ExportDialogProps {
  imageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportDialog({ imageUrl, isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("image/png");
  const [quality, setQuality] = useState(0.92);
  const [presetIdx, setPresetIdx] = useState(0);
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!imageUrl) return;
    setExporting(true);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      const preset = DEFAULT_PRESETS[presetIdx];
      let targetW = preset.width || img.naturalWidth;
      let targetH = preset.height || img.naturalHeight;

      // If both set, fit within bounds keeping aspect
      if (preset.width && preset.height) {
        const ratio = Math.min(preset.width / img.naturalWidth, preset.height / img.naturalHeight);
        targetW = Math.round(img.naturalWidth * ratio);
        targetH = Math.round(img.naturalHeight * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No canvas context");

      // JPEG: white background
      if (format === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetW, targetH);
      }
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const ext = format === "image/jpeg" ? "jpg" : format === "image/png" ? "png" : "webp";
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), format, quality)
      );
      if (!blob) throw new Error("Failed to encode");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error("Export failed:", err);
      alert(`导出失败: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          导出图片
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              格式
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`px-2 py-2 text-xs rounded ${
                    format === f ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {FORMAT_LABELS[f].split(" ")[0]}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">{FORMAT_LABELS[format]}</p>
          </div>

          {format !== "image/png" && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>质量</span>
                <span>{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-slate-900"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              尺寸预设
            </label>
            <select
              value={presetIdx}
              onChange={(e) => setPresetIdx(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
            >
              {DEFAULT_PRESETS.map((p, i) => (
                <option key={i} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={!imageUrl || exporting}
            className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
          >
            {exporting ? "导出中..." : "下载"}
          </button>
        </div>
      </div>
    </div>
  );
}
