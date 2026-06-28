/**
 * ImageCutout Tool Component
 *
 * Rectangle or brush-based cutout with feathered edges.
 * Output PNG with transparent area outside selection.
 */

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useImageCutout, type CutoutMode } from "@/hooks/useImageCutout";
import * as m from "@/paraglide/messages.js";

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
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{m.tool_cutoutTitle()}</h1>
        <p className="text-sm text-slate-500 mt-1">{m.tool_cutoutSubtitle()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{m.tool_selectionMode()}</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {(["rectangle", "brush"] as CutoutMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setOptions({ ...options, mode });
                    clearSelection();
                  }}
                  className={`px-2 py-1.5 text-xs rounded ${
                    options.mode === mode ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {mode === "rectangle" ? m.tool_rectangle() : m.tool_brush()}
                </button>
              ))}
            </div>
          </div>

          {options.mode === "brush" && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{m.tool_brushSize()}</span>
                <span>{options.brushSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={options.brushSize}
                onChange={(e) => setOptions({ ...options, brushSize: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>
          )}

          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{m.tool_feather()}</span>
              <span>{options.feather}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={options.feather}
              onChange={(e) => setOptions({ ...options, feather: Number(e.target.value) })}
              className="w-full accent-slate-900"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
            >
              {imageUrl ? m.common_changeImage() : m.common_selectImage()}
            </button>
            <button
              onClick={clearSelection}
              disabled={!selection && brushPath.length === 0}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {m.common_clear()}
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
              className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {m.tool_downloadPng()}
            </button>
          )}

          {previewUrl && (
            <a
              href={previewUrl}
              download="cutout.png"
              className="block text-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {m.tool_redownload()}
            </a>
          )}
        </div>

        <div className="lg:col-span-2">
          <div
            className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
            }}
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
              <div className="text-center py-12 text-slate-400">
                {m.tool_uploadImageStart()}<br />
                <span className="text-xs">{m.common_supportedImageFormats()}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            {options.mode === "rectangle" ? m.tool_cutoutRectangleInstruction() : m.tool_cutoutBrushInstruction()} · {m.tool_featherSoftensEdges()}
          </p>
        </div>
      </div>
    </div>
  );
}
