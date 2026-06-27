/**
 * ImageCutout Tool Component
 *
 * Rectangle or brush-based cutout with feathered edges.
 * Output PNG with transparent area outside selection.
 */

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Download, Eraser, ImagePlus, Scissors } from "lucide-react";
import { useImageCutout, type CutoutMode } from "@/hooks/useImageCutout";

export default function ImageCutout() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    options,
    setOptions,
    imageUrl,
    setImage,
    selection,
    brushPath,
    displayRef,
    previewUrl,
    startSelection,
    updateSelection,
    endSelection,
    clearSelection,
    download,
  } = useImageCutout();
  const dragState = useRef<{ active: boolean; startX: number; startY: number }>({ active: false, startX: 0, startY: 0 });
  const [scale, setScale] = useState(1);

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
      const canvas = displayRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;
      return { x, y };
    },
    [scale, displayRef]
  );

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e);
    if (!pt) return;
    dragState.current = { active: true, startX: pt.x, startY: pt.y };
    startSelection(pt.x, pt.y);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.current.active) return;
    const pt = getCanvasPoint(e);
    if (!pt) return;
    updateSelection(pt.x, pt.y, dragState.current.startX, dragState.current.startY);
  };

  const onMouseUp = () => {
    dragState.current.active = false;
    endSelection();
  };

  // Compute display scale
  useEffect(() => {
    if (!displayRef.current) return;
    const canvas = displayRef.current;
    const containerWidth = canvas.parentElement?.clientWidth ?? 600;
    const maxWidth = Math.min(containerWidth - 32, 800);
    if (canvas.width > maxWidth) {
      setScale(maxWidth / canvas.width);
    } else {
      setScale(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  return (
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-8 max-w-3xl">
          <p className="page-kicker">Tool bench / Cutout</p>
          <h1 className="page-title mt-2">智能抠图</h1>
          <p className="page-description mt-3">矩形或画笔选区 → 边缘羽化 → 导出透明 PNG</p>
        </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="panel space-y-4 p-4">
          <div>
              <h2 className="panel-title mb-2">选区模式</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {(["rectangle", "brush"] as CutoutMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setOptions({ ...options, mode: m });
                    clearSelection();
                  }}
                    className={`segmented-option ${options.mode === m ? "segmented-option-active" : ""}`}
                >
                  {m === "rectangle" ? "矩形" : "画笔"}
                </button>
              ))}
            </div>
          </div>

          {options.mode === "brush" && (
            <div>
                <div className="mb-1 flex justify-between text-xs font-medium text-foreground-muted">
                <span>画笔大小</span>
                <span>{options.brushSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={options.brushSize}
                onChange={(e) => setOptions({ ...options, brushSize: Number(e.target.value) })}
                  className="range"
                  aria-label="画笔大小"
              />
            </div>
          )}

          <div>
              <div className="mb-1 flex justify-between text-xs font-medium text-foreground-muted">
              <span>边缘羽化</span>
              <span>{options.feather}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={options.feather}
              onChange={(e) => setOptions({ ...options, feather: Number(e.target.value) })}
                className="range"
                aria-label="边缘羽化"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
                className="btn-primary h-10 flex-1 gap-2"
            >
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
              {imageUrl ? "更换图片" : "选择图片"}
            </button>
            <button
              onClick={clearSelection}
              disabled={!selection && brushPath.length === 0}
                className="btn-secondary h-10 gap-2 px-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Eraser className="h-4 w-4" aria-hidden="true" />
              清除
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setImage(f);
            }}
            className="hidden"
            id="cutout-input"
          />

          {imageUrl && (
            <button
              onClick={download}
                className="btn-secondary h-10 w-full gap-2"
            >
                <Download className="h-4 w-4" aria-hidden="true" />
              下载 PNG
            </button>
          )}

          {previewUrl && (
            <a
              href={previewUrl}
              download="cutout.png"
                className="block text-center text-xs font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]"
            >
              重新下载
            </a>
          )}
        </div>

        <div className="lg:col-span-2">
          <div
              className="checkerboard panel p-4"
          >
            {imageUrl ? (
              <div className="overflow-auto flex items-center justify-center min-h-[500px]">
                <canvas
                  ref={displayRef}
                  onMouseDown={onMouseDown}
                  onMouseMove={onMouseMove}
                  onMouseUp={onMouseUp}
                  onMouseLeave={onMouseUp}
                  style={{
                    width: displayRef.current ? `${displayRef.current.width * scale}px` : "auto",
                    height: displayRef.current ? `${displayRef.current.height * scale}px` : "auto",
                    cursor: "crosshair",
                    maxWidth: "100%",
                  }}
                />
              </div>
            ) : (
                <div className="flex min-h-[500px] flex-col items-center justify-center py-12 text-center text-foreground-muted">
                  <Scissors className="mb-4 h-10 w-10" aria-hidden="true" />
                上传图片开始<br />
                <span className="text-xs">支持 PNG / JPG / WebP</span>
              </div>
            )}
          </div>
            <p className="mt-2 text-center text-xs font-medium text-foreground-muted">
            {options.mode === "rectangle" ? "拖动鼠标绘制矩形选区" : "拖动鼠标绘制选区"} · 羽化软化边缘
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
