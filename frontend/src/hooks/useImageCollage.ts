/**
 * useImageCollage Hook
 *
 * Compose multiple images into a single collage using Canvas API.
 */

import { useState, useCallback, useRef, useEffect } from "react";

export type LayoutTemplate = "1x1" | "1x2" | "1x3" | "2x2" | "2x3" | "3x3";

export const LAYOUTS: Record<LayoutTemplate, { label: string; rows: number; cols: number; cellCount: number }> = {
  "1x1": { label: "1 张", rows: 1, cols: 1, cellCount: 1 },
  "1x2": { label: "1×2 (2 张)", rows: 1, cols: 2, cellCount: 2 },
  "1x3": { label: "1×3 (3 张)", rows: 1, cols: 3, cellCount: 3 },
  "2x2": { label: "2×2 (4 张)", rows: 2, cols: 2, cellCount: 4 },
  "2x3": { label: "2×3 (6 张)", rows: 2, cols: 3, cellCount: 6 },
  "3x3": { label: "3×3 (9 张)", rows: 3, cols: 3, cellCount: 9 },
};

export interface CollageCell {
  imageUrl: string | null;
  scale: number; // 1 = fit, > 1 = zoom in
  offsetX: number; // 0-1
  offsetY: number; // 0-1
}

export interface CollageOptions {
  layout: LayoutTemplate;
  outputWidth: number;
  outputHeight: number;
  backgroundColor: string;
  gap: number; // pixels between cells
  borderRadius: number;
}

const DEFAULT_OPTIONS: CollageOptions = {
  layout: "2x2",
  outputWidth: 1080,
  outputHeight: 1080,
  backgroundColor: "#ffffff",
  gap: 8,
  borderRadius: 8,
};

export function useImageCollage() {
  const [options, setOptions] = useState<CollageOptions>(DEFAULT_OPTIONS);
  const [cells, setCells] = useState<CollageCell[]>(() => {
    const layout = LAYOUTS["2x2"];
    return Array.from({ length: layout.cellCount }, () => ({
      imageUrl: null,
      scale: 1,
      offsetX: 0.5,
      offsetY: 0.5,
    }));
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  // Reset cells when layout changes
  useEffect(() => {
    setCells((prev) => {
      const target = LAYOUTS[options.layout].cellCount;
      if (prev.length === target) return prev;
      const next: CollageCell[] = [];
      for (let i = 0; i < target; i++) {
        next.push(prev[i] ?? { imageUrl: null, scale: 1, offsetX: 0.5, offsetY: 0.5 });
      }
      return next;
    });
  }, [options.layout]);

  // Render the collage to canvas
  const render = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    canvas.width = options.outputWidth;
    canvas.height = options.outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const layout = LAYOUTS[options.layout];
    const cellW = (canvas.width - options.gap * (layout.cols + 1)) / layout.cols;
    const cellH = (canvas.height - options.gap * (layout.rows + 1)) / layout.rows;

    // Load all images
    const imagePromises = cells.map((cell) => {
      if (!cell.imageUrl) return Promise.resolve(null);
      return new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        if (cell.imageUrl) img.src = cell.imageUrl;
      });
    });
    const images = await Promise.all(imagePromises);

    // Draw each cell
    cells.forEach((cell, index) => {
      const row = Math.floor(index / layout.cols);
      const col = index % layout.cols;
      const x = options.gap + col * (cellW + options.gap);
      const y = options.gap + row * (cellH + options.gap);

      ctx.save();
      // Border radius
      if (options.borderRadius > 0) {
        ctx.beginPath();
        const r = options.borderRadius;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + cellW, y, x + cellW, y + cellH, r);
        ctx.arcTo(x + cellW, y + cellH, x, y + cellH, r);
        ctx.arcTo(x, y + cellH, x, y, r);
        ctx.arcTo(x, y, x + cellW, y, r);
        ctx.closePath();
        ctx.clip();
      }

      const img = images[index];
      if (img) {
        // Cover-fit with scale and offset
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const cellRatio = cellW / cellH;
        let drawW: number, drawH: number;
        if (imgRatio > cellRatio) {
          // Image is wider — fit height, overflow width
          drawH = cellH * cell.scale;
          drawW = drawH * imgRatio;
        } else {
          // Image is taller — fit width, overflow height
          drawW = cellW * cell.scale;
          drawH = drawW / imgRatio;
        }
        const drawX = x + (cellW - drawW) * cell.offsetX;
        const drawY = y + (cellH - drawH) * cell.offsetY;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      } else {
        // Empty cell placeholder
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(x, y, cellW, cellH);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`#${index + 1}`, x + cellW / 2, y + cellH / 2);
      }
      ctx.restore();
    });

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }, [options, cells]);

  const addImage = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setCells((prev) => {
        const emptyIdx = prev.findIndex((c) => !c.imageUrl);
        if (emptyIdx === -1) return prev;
        const next = [...prev];
        next[emptyIdx] = { imageUrl: url, scale: 1, offsetX: 0.5, offsetY: 0.5 };
        return next;
      });
    },
    []
  );

  const removeCell = useCallback((index: number) => {
    setCells((prev) => {
      const cell = prev[index];
      if (cell.imageUrl) URL.revokeObjectURL(cell.imageUrl);
      const next = [...prev];
      next[index] = { imageUrl: null, scale: 1, offsetX: 0.5, offsetY: 0.5 };
      return next;
    });
  }, []);

  const updateCell = useCallback((index: number, partial: Partial<CollageCell>) => {
    setCells((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...partial };
      return next;
    });
  }, []);

  const exportImage = useCallback(async () => {
    setExporting(true);
    const blob = await render();
    setExporting(false);
    if (blob) {
      if (exportUrl) URL.revokeObjectURL(exportUrl);
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
    }
    return blob;
  }, [render, exportUrl]);

  const download = useCallback(async () => {
    const blob = await exportImage();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "collage.png";
    a.click();
  }, [exportImage]);

  return {
    options,
    setOptions,
    cells,
    addImage,
    removeCell,
    updateCell,
    canvasRef,
    render,
    exportImage,
    exportUrl,
    exporting,
    download,
  };
}
