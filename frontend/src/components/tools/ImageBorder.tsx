/**
 * ImageBorder Tool Component
 *
 * Apply preset borders, drop shadows, and decorative badges to an image.
 */

"use client";

import { useRef } from "react";
import { useImageBorder, BORDER_STYLES, BADGES, type BorderStyle, type BadgeStyle } from "@/hooks/useImageBorder";

export default function ImageBorder() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { options, setOptions, imageUrl, setImage, canvasRef, previewUrl, exporting, download } = useImageBorder();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">智能边框与装饰</h1>
        <p className="text-sm text-slate-500 mt-1">
          为商品图片添加专业级边框、投影、徽章
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Options */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4">
          <div>
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">边框样式</h2>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setOptions({ ...options, borderStyle: "none" })}
                className={`px-2 py-1.5 text-xs rounded ${
                  options.borderStyle === "none" ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                无
              </button>
              {(Object.keys(BORDER_STYLES) as Exclude<BorderStyle, "none">[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setOptions({ ...options, borderStyle: key })}
                  className={`px-2 py-1.5 text-xs rounded ${
                    options.borderStyle === key ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {BORDER_STYLES[key].label}
                </button>
              ))}
            </div>
          </div>

          {options.borderStyle !== "none" && (
            <>
              <div>
                <label className="block text-xs text-slate-500 mb-1">边框/背景色</label>
                <input
                  type="color"
                  value={options.borderColor}
                  onChange={(e) => setOptions({ ...options, borderColor: e.target.value })}
                  className="w-full h-8 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>留白</span>
                  <span>{options.outputPadding}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={options.outputPadding}
                  onChange={(e) => setOptions({ ...options, outputPadding: Number(e.target.value) })}
                  className="w-full accent-slate-900"
                />
              </div>
            </>
          )}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">徽章</h2>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setOptions({ ...options, badge: "none" })}
                className={`px-2 py-1.5 text-xs rounded ${
                  options.badge === "none" ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                无
              </button>
              {(Object.keys(BADGES) as Exclude<BadgeStyle, "none">[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setOptions({ ...options, badge: key })}
                  className={`px-2 py-1.5 text-xs rounded ${
                    options.badge === key ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {BADGES[key].label}
                </button>
              ))}
            </div>
          </div>

          {options.badge !== "none" && (
            <>
              <div>
                <h3 className="text-xs text-slate-500 mb-1">位置</h3>
                <div className="grid grid-cols-4 gap-1">
                  {(["tl", "tr", "bl", "br"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setOptions({ ...options, badgePosition: pos })}
                      className={`h-8 text-xs rounded ${
                        options.badgePosition === pos ? "bg-slate-900 text-white" : "bg-slate-100 dark:bg-slate-800"
                      }`}
                    >
                      {pos === "tl" ? "↖" : pos === "tr" ? "↗" : pos === "bl" ? "↙" : "↘"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>大小</span>
                  <span>{options.badgeSize}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="120"
                  value={options.badgeSize}
                  onChange={(e) => setOptions({ ...options, badgeSize: Number(e.target.value) })}
                  className="w-full accent-slate-900"
                />
              </div>
            </>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
          >
            {imageUrl ? "更换图片" : "选择图片"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setImage(f);
            }}
            className="hidden"
            id="border-input"
          />
          {imageUrl && (
            <button
              onClick={download}
              disabled={exporting}
              className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {exporting ? "导出中..." : "下载 PNG"}
            </button>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded min-h-[500px]">
              <canvas ref={canvasRef} className="hidden" />
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="max-w-full max-h-[600px] object-contain" />
              ) : (
                <p className="text-slate-400 p-12 text-center">
                  上传图片开始<br />
                  <span className="text-xs">支持 PNG / JPG / WebP</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
