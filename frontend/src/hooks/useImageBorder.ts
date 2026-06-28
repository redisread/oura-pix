/**
 * useImageBorder Hook
 *
 * Apply preset borders, drop shadows, and decorative badges to an image
 * using Canvas API.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import * as m from "@/paraglide/messages.js";

export type BorderStyle = "none" | "minimal" | "shadow" | "rounded" | "double" | "gradient" | "thick" | "polaroid";
export type BadgeStyle = "none" | "new" | "hot" | "discount" | "free-shipping" | "limited" | "best-seller";

export const BORDER_STYLES: Record<Exclude<BorderStyle, "none">, { css: string }> = {
  minimal: { css: "1px solid #e5e7eb" },
  shadow: { css: "0 10px 30px rgba(0,0,0,0.15)" },
  rounded: { css: "0 0 0 8px #fff, 0 0 0 12px #e2e8f0" },
  double: { css: "0 0 0 4px #fff, 0 0 0 6px #1e293b, 0 0 0 10px #fff" },
  gradient: { css: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  thick: { css: "0 0 0 16px #1e293b" },
  polaroid: { css: "0 0 0 8px #fff, 0 8px 24px rgba(0,0,0,0.2)" },
};

export const BADGES: Record<Exclude<BadgeStyle, "none">, { bg: string; text: string }> = {
  new: { bg: "#10b981", text: "NEW" },
  hot: { bg: "#ef4444", text: "HOT" },
  discount: { bg: "#f59e0b", text: "SALE" },
  "free-shipping": { bg: "#3b82f6", text: "FREE" },
  limited: { bg: "#8b5cf6", text: "LIMITED" },
  "best-seller": { bg: "#dc2626", text: "#1" },
};

export function getBorderStyleLabel(style: Exclude<BorderStyle, "none">): string {
  switch (style) {
    case "minimal":
      return m.tool_borderMinimal();
    case "shadow":
      return m.tool_borderShadow();
    case "rounded":
      return m.tool_borderRounded();
    case "double":
      return m.tool_borderDouble();
    case "gradient":
      return m.tool_borderGradient();
    case "thick":
      return m.tool_borderThick();
    case "polaroid":
      return m.tool_borderPolaroid();
  }
}

export function getBadgeLabel(badge: Exclude<BadgeStyle, "none">): string {
  switch (badge) {
    case "new":
      return m.tool_badgeNew();
    case "hot":
      return m.tool_badgeHot();
    case "discount":
      return m.tool_badgeDiscount();
    case "free-shipping":
      return m.tool_badgeFreeShipping();
    case "limited":
      return m.tool_badgeLimited();
    case "best-seller":
      return m.tool_badgeBestSeller();
  }
}

export interface BorderOptions {
  borderStyle: BorderStyle;
  borderWidth: number; // pixels
  borderColor: string;
  badge: BadgeStyle;
  badgePosition: "tl" | "tr" | "bl" | "br";
  badgeSize: number; // pixels (square)
  outputPadding: number; // canvas padding around image
}

const DEFAULT_OPTIONS: BorderOptions = {
  borderStyle: "shadow",
  borderWidth: 8,
  borderColor: "#ffffff",
  badge: "none",
  badgePosition: "tr",
  badgeSize: 60,
  outputPadding: 32,
};

export function useImageBorder() {
  const [options, setOptions] = useState<BorderOptions>(DEFAULT_OPTIONS);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const render = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return null;

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageUrl;
    });

    // Output canvas size = image + padding
    const padX = options.borderStyle === "none" ? 0 : options.outputPadding;
    const padY = options.borderStyle === "none" ? 0 : options.outputPadding;
    canvas.width = img.naturalWidth + padX * 2;
    canvas.height = img.naturalHeight + padY * 2;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Background
    ctx.fillStyle = options.borderColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply border radius for rounded styles
    if (options.borderStyle === "rounded" || options.borderStyle === "polaroid") {
      const r = options.borderStyle === "polaroid" ? 8 : 16;
      const x = padX;
      const y = padY;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(img, padX, padY, img.naturalWidth, img.naturalHeight);
    }

    // Apply shadow for shadow/polaroid
    if (options.borderStyle === "shadow" || options.borderStyle === "polaroid") {
      // Re-render with shadow
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 12;
      const r = options.borderStyle === "polaroid" ? 8 : 0;
      const x = padX;
      const y = padY;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      ctx.beginPath();
      if (r > 0) {
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Apply double border
    if (options.borderStyle === "double") {
      ctx.save();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.strokeRect(padX + 6, padY + 6, img.naturalWidth - 12, img.naturalHeight - 12);
      ctx.restore();
    }

    // Apply gradient
    if (options.borderStyle === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#667eea");
      grad.addColorStop(1, "#764ba2");
      ctx.save();
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // Badge
    if (options.badge !== "none") {
      const badge = BADGES[options.badge];
      const size = options.badgeSize;
      const positions = {
        tl: [padX + 16, padY + 16],
        tr: [padX + img.naturalWidth - size - 16, padY + 16],
        bl: [padX + 16, padY + img.naturalHeight - size - 16],
        br: [padX + img.naturalWidth - size - 16, padY + img.naturalHeight - size - 16],
      } as const;
      const [bx, by] = positions[options.badgePosition];

      ctx.save();
      // Circle bg
      ctx.fillStyle = badge.bg;
      ctx.beginPath();
      ctx.arc(bx + size / 2, by + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      // Text
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.floor(size * 0.28)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // Adjust font size for long text
      const displayText = getBadgeLabel(options.badge);
      if (displayText.length > 4) {
        ctx.font = `bold ${Math.floor(size * 0.22)}px sans-serif`;
      }
      ctx.fillText(displayText, bx + size / 2, by + size / 2);
      ctx.restore();
    }

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }, [imageUrl, options]);

  useEffect(() => {
    if (!imageUrl) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }
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
  }, [imageUrl, options]);

  const setImage = useCallback((file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
  }, [imageUrl]);

  const download = useCallback(async () => {
    setExporting(true);
    const blob = await render();
    setExporting(false);
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bordered.png";
    a.click();
  }, [render]);

  return {
    options,
    setOptions,
    imageUrl,
    setImage,
    canvasRef,
    previewUrl,
    exporting,
    download,
  };
}
