/**
 * useImageCutout Hook
 *
 * Rectangle or brush-based cutout with feathered edges.
 * Output: PNG with transparency outside selection.
 */

import { useState, useCallback, useRef } from "react";

export type CutoutMode = "rectangle" | "brush";

export interface CutoutOptions {
  mode: CutoutMode;
  feather: number; // 0-20 px
  brushSize: number; // 10-100 px
}

const DEFAULT_OPTIONS: CutoutOptions = {
  mode: "rectangle",
  feather: 2,
  brushSize: 30,
};

export function useImageCutout() {
  const [options, setOptions] = useState<CutoutOptions>(DEFAULT_OPTIONS);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [brushPath, setBrushPath] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayRef = useRef<HTMLCanvasElement | null>(null);

  const setImage = useCallback(
    (file: File) => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      const img = new Image();
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        setSelection(null);
        setBrushPath([]);
      };
      img.src = url;
    },
    [imageUrl]
  );

  const renderDisplay = useCallback(() => {
    const display = displayRef.current;
    if (!display || !imageUrl) return;
    const img = new Image();
    img.onload = () => {
      display.width = img.naturalWidth;
      display.height = img.naturalHeight;
      const ctx = display.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      // Overlay selection
      if (options.mode === "rectangle" && selection) {
        ctx.save();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
        ctx.fillStyle = "rgba(59,130,246,0.1)";
        ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
        ctx.restore();
      } else if (options.mode === "brush" && brushPath.length > 0) {
        ctx.save();
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = options.brushSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(brushPath[0].x, brushPath[0].y);
        brushPath.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.restore();
      }
    };
    img.src = imageUrl;
  }, [imageUrl, options, selection, brushPath]);

  const exportCutout = useCallback(async (): Promise<Blob | null> => {
    if (!imageUrl) return null;
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageUrl;
    });

    const out = document.createElement("canvas");
    out.width = img.naturalWidth;
    out.height = img.naturalHeight;
    const ctx = out.getContext("2d");
    if (!ctx) return null;

    // Build alpha mask
    const mask = document.createElement("canvas");
    mask.width = img.naturalWidth;
    mask.height = img.naturalHeight;
    const mctx = mask.getContext("2d");
    if (!mctx) return null;
    mctx.fillStyle = "#000";
    mctx.fillRect(0, 0, out.width, out.height);
    mctx.fillStyle = "#fff";
    if (options.mode === "rectangle" && selection) {
      mctx.fillRect(selection.x, selection.y, selection.w, selection.h);
    } else if (options.mode === "brush" && brushPath.length > 0) {
      mctx.strokeStyle = "#fff";
      mctx.lineWidth = options.brushSize;
      mctx.lineCap = "round";
      mctx.lineJoin = "round";
      mctx.beginPath();
      mctx.moveTo(brushPath[0].x, brushPath[0].y);
      brushPath.forEach((p) => mctx.lineTo(p.x, p.y));
      mctx.stroke();
    } else {
      // No selection: keep whole image
      mctx.fillStyle = "#fff";
      mctx.fillRect(0, 0, out.width, out.height);
    }

    // Apply feather (box blur approximation) to mask
    if (options.feather > 0) {
      const imgData = mctx.getImageData(0, 0, out.width, out.height);
      const blurred = boxBlur(imgData, options.feather);
      mctx.putImageData(blurred, 0, 0);
    }

    // Draw image, then erase with inverse mask
    ctx.drawImage(img, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = "source-over";

    return new Promise<Blob | null>((resolve) => {
      out.toBlob((blob) => resolve(blob), "image/png");
    });
  }, [imageUrl, options, selection, brushPath]);

  const download = useCallback(async () => {
    const blob = await exportCutout();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cutout.png";
    a.click();
    setPreviewUrl(url);
  }, [exportCutout]);

  // Mouse handlers for selection
  const startSelection = useCallback(
    (x: number, y: number) => {
      if (options.mode === "rectangle") {
        setSelection({ x, y, w: 0, h: 0 });
      } else {
        setIsDrawing(true);
        setBrushPath([{ x, y }]);
      }
    },
    [options.mode]
  );

  const updateSelection = useCallback(
    (x: number, y: number, startX: number, startY: number) => {
      if (options.mode === "rectangle") {
        setSelection({
          x: Math.min(startX, x),
          y: Math.min(startY, y),
          w: Math.abs(x - startX),
          h: Math.abs(y - startY),
        });
      } else if (isDrawing) {
        setBrushPath((prev) => [...prev, { x, y }]);
      }
    },
    [options.mode, isDrawing]
  );

  const endSelection = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setBrushPath([]);
  }, []);

  return {
    options,
    setOptions,
    imageUrl,
    imageSize,
    setImage,
    selection,
    brushPath,
    canvasRef,
    displayRef,
    previewUrl,
    renderDisplay,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    exportCutout,
    download,
  };
}

// Simple box blur for feather
function boxBlur(imageData: ImageData, radius: number): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);
  const r = Math.max(1, Math.floor(radius));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let count = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const i = (ny * width + nx) * 4;
            sum += data[i]; // alpha
            count++;
          }
        }
      }
      const avg = sum / count;
      const i = (y * width + x) * 4;
      output.data[i] = avg;
      output.data[i + 1] = avg;
      output.data[i + 2] = avg;
      output.data[i + 3] = avg;
    }
  }
  return output;
}
