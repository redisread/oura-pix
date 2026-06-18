/**
 * useBatchProcess Hook
 *
 * Batch process multiple images with resize, compress, watermark, and format conversion.
 * Pure client-side via Canvas API.
 */

import { useState, useCallback } from "react";
import JSZip from "jszip";

export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export interface BatchOptions {
  resizeWidth?: number;
  resizeHeight?: number;
  keepAspect: boolean;
  quality: number; // 0-1
  format: OutputFormat;
  watermarkText: string;
  watermarkEnabled: boolean;
}

export interface BatchItem {
  id: string;
  file: File;
  originalUrl: string;
  resultBlob: Blob | null;
  resultUrl: string | null;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
  originalSize: number;
  resultSize: number;
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: BatchOptions = {
  resizeWidth: undefined,
  resizeHeight: undefined,
  keepAspect: true,
  quality: 0.9,
  format: "image/jpeg",
  watermarkText: "",
  watermarkEnabled: false,
};

export function useBatchProcess() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [options, setOptions] = useState<BatchOptions>(DEFAULT_OPTIONS);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newItems: BatchItem[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        originalUrl: URL.createObjectURL(file),
        resultBlob: null,
        resultUrl: null,
        status: "pending",
        originalSize: file.size,
        resultSize: 0,
        width: 0,
        height: 0,
      }));
    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const removed = prev.find((i) => i.id === id);
      if (removed) {
        URL.revokeObjectURL(removed.originalUrl);
        if (removed.resultUrl) URL.revokeObjectURL(removed.resultUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearAll = useCallback(() => {
    items.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    setItems([]);
  }, [items]);

  const processImage = useCallback(
    async (item: BatchItem, opts: BatchOptions): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          // Compute target dimensions
          let targetW = opts.resizeWidth ?? img.naturalWidth;
          let targetH = opts.resizeHeight ?? img.naturalHeight;
          if (opts.keepAspect && (opts.resizeWidth || opts.resizeHeight)) {
            if (opts.resizeWidth && !opts.resizeHeight) {
              targetH = Math.round((img.naturalHeight * opts.resizeWidth) / img.naturalWidth);
            } else if (opts.resizeHeight && !opts.resizeWidth) {
              targetW = Math.round((img.naturalWidth * opts.resizeHeight) / img.naturalHeight);
            } else {
              // Both specified — fit within bounds keeping aspect
              const ratio = Math.min(opts.resizeWidth! / img.naturalWidth, opts.resizeHeight! / img.naturalHeight);
              targetW = Math.round(img.naturalWidth * ratio);
              targetH = Math.round(img.naturalHeight * ratio);
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          // White background for JPEG (no alpha)
          if (opts.format === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, targetW, targetH);
          }

          ctx.drawImage(img, 0, 0, targetW, targetH);

          // Watermark
          if (opts.watermarkEnabled && opts.watermarkText) {
            ctx.font = `${Math.max(16, targetH / 25)}px sans-serif`;
            ctx.fillStyle = "rgba(255,255,255,0.6)";
            ctx.strokeStyle = "rgba(0,0,0,0.4)";
            ctx.lineWidth = 2;
            const text = opts.watermarkText;
            const metrics = ctx.measureText(text);
            const x = targetW - metrics.width - 20;
            const y = targetH - 20;
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
          }

          canvas.toBlob(
            (blob) => {
              if (blob) {
                item.width = targetW;
                item.height = targetH;
                resolve(blob);
              } else {
                reject(new Error("Failed to encode image"));
              }
            },
            opts.format,
            opts.quality
          );
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = item.originalUrl;
      });
    },
    []
  );

  const processAll = useCallback(async () => {
    if (items.length === 0) return;
    setProcessing(true);
    setProgress(0);

    let completed = 0;
    for (const item of items) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "processing" } : i))
      );
      try {
        const blob = await processImage(item, options);
        const url = URL.createObjectURL(blob);
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "done", resultBlob: blob, resultUrl: url, resultSize: blob.size }
              : i
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: err instanceof Error ? err.message : "Error" }
              : i
          )
        );
      }
      completed++;
      setProgress(Math.round((completed / items.length) * 100));
    }

    setProcessing(false);
  }, [items, options, processImage]);

  const downloadOne = useCallback((item: BatchItem) => {
    if (!item.resultBlob || !item.resultUrl) return;
    const ext = options.format === "image/jpeg" ? "jpg" : options.format === "image/png" ? "png" : "webp";
    const baseName = item.file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = item.resultUrl;
    a.download = `${baseName}-processed.${ext}`;
    a.click();
  }, [options.format]);

  const downloadZip = useCallback(async () => {
    const zip = new JSZip();
    const ext = options.format === "image/jpeg" ? "jpg" : options.format === "image/png" ? "png" : "webp";
    items.forEach((item) => {
      if (item.resultBlob) {
        const baseName = item.file.name.replace(/\.[^.]+$/, "");
        zip.file(`${baseName}-processed.${ext}`, item.resultBlob);
      }
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "processed-images.zip";
    a.click();
    URL.revokeObjectURL(url);
  }, [items, options.format]);

  return {
    items,
    options,
    setOptions,
    processing,
    progress,
    addFiles,
    removeItem,
    clearAll,
    processAll,
    downloadOne,
    downloadZip,
  };
}
