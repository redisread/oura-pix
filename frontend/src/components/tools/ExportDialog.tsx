/**
 * ExportDialog Component
 *
 * Reusable export dialog: choose format (PNG/JPG/WebP), quality, and size preset.
 * Outputs a single file with the chosen settings.
 */

"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import * as m from "@/paraglide/messages.js";

export type ExportFormat = "image/png" | "image/jpeg" | "image/webp";

export interface SizePreset {
  label: () => string;
  width: number;
  height: number;
}

const DEFAULT_PRESETS: SizePreset[] = [
  { label: m.tool_presetOriginal, width: 0, height: 0 },
  { label: m.tool_presetAmazonMain, width: 2000, height: 2000 },
  { label: () => "Shopify (2048×2048)", width: 2048, height: 2048 },
  { label: () => "eBay (1600×1600)", width: 1600, height: 1600 },
  { label: () => "Instagram 1:1 (1080×1080)", width: 1080, height: 1080 },
  { label: () => "Instagram 4:5 (1080×1350)", width: 1080, height: 1350 },
  { label: m.tool_presetXiaohongshu, width: 1080, height: 1440 },
  { label: m.tool_presetDouyinShop, width: 750, height: 1000 },
];

function getFormatLabel(format: ExportFormat): string {
  switch (format) {
    case "image/png":
      return m.tool_formatPng();
    case "image/jpeg":
      return m.tool_formatJpeg();
    case "image/webp":
      return m.tool_formatWebp();
  }
}

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
      alert(m.tool_exportFailed({ message: err instanceof Error ? err.message : m.common_unknownError() }));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground)/0.42)] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
    >
      <div
        className="panel w-full max-w-md overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="proof-strip h-2" />
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="page-kicker">{m.tool_exportProofKicker()}</p>
              <h2 id="export-dialog-title" className="font-display mt-1 text-2xl font-semibold text-foreground">{m.tool_exportDialogTitle()}</h2>
            </div>
            <button type="button" onClick={onClose} className="icon-button h-9 w-9" aria-label={m.tool_exportCloseAria()}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

        <div className="space-y-4">
          <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">{m.tool_format()}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["image/png", "image/jpeg", "image/webp"] as ExportFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                    className={`segmented-option ${format === f ? "segmented-option-active" : ""}`}
                >
                  {getFormatLabel(f).split(" ")[0]}
                </button>
              ))}
            </div>
              <p className="mt-1 text-xs font-medium text-foreground-muted">{getFormatLabel(format)}</p>
          </div>

          {format !== "image/png" && (
            <div>
                <div className="mb-1 flex justify-between text-xs font-medium text-foreground-muted">
                <span>{m.tool_quality()}</span>
                <span>{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                  className="range"
                  aria-label={m.tool_exportQualityAria()}
              />
            </div>
          )}

          <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">{m.tool_sizePreset()}</label>
            <select
              value={presetIdx}
              onChange={(e) => setPresetIdx(Number(e.target.value))}
                className="input"
            >
              {DEFAULT_PRESETS.map((p, i) => (
                <option key={i} value={i}>
                  {p.label()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            onClick={onClose}
              className="btn-secondary h-10 px-4"
          >
            {m.common_cancel()}
          </button>
          <button
            onClick={handleExport}
            disabled={!imageUrl || exporting}
              className="btn-primary h-10 gap-2 px-4 disabled:cursor-not-allowed disabled:opacity-50"
          >
              <Download className="h-4 w-4" aria-hidden="true" />
            {exporting ? m.tool_exporting() : m.common_download()}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
