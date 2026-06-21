/**
 * BackgroundRemover Tool Component
 *
 * Standalone page that uses @imgly/background-removal to remove image backgrounds
 * entirely in the browser via WASM.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useBackgroundRemoval } from "@/hooks/useBackgroundRemoval";

export default function BackgroundRemover() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { loading, progress, error, result, remove, reset } = useBackgroundRemoval();

  // Clean up object URLs on unmount or when image changes
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (result) URL.revokeObjectURL(result.url);
    reset();
    setImageUrl(URL.createObjectURL(file));
  };

  const handleRemove = () => {
    if (!imageUrl) return;
    void remove(imageUrl);
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = "removed-background.png";
    a.click();
  };

  const handleReset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (result) URL.revokeObjectURL(result.url);
    setImageUrl(null);
    reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">智能去背景</h1>
        <p className="text-sm text-slate-500 mt-1">
          浏览器内运行，无需上传服务器。基于 @imgly/background-removal（WASM）。
        </p>
      </div>

      {!imageUrl ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="bg-remover-input"
          />
          <label
            htmlFor="bg-remover-input"
            className="inline-block cursor-pointer px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            选择图片
          </label>
          <p className="text-xs text-slate-500 mt-3">支持 PNG / JPG / WebP</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">原图</div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded p-2 flex items-center justify-center min-h-[200px]">
                <img src={imageUrl} alt="Original" className="max-w-full max-h-96 object-contain" loading="lazy" decoding="async" />
              </div>
            </div>

            {/* Result */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">去背景后</div>
                {result && (
                  <span className="text-xs text-slate-500">
                    {result.width} × {result.height}
                  </span>
                )}
              </div>
              <div
                className="rounded p-2 flex items-center justify-center min-h-[200px]"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
                  backgroundSize: "16px 16px",
                  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                }}
              >
                {loading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">处理中... {progress}%</p>
                    <div className="w-32 h-1 bg-slate-200 dark:bg-slate-800 rounded mt-2 mx-auto overflow-hidden">
                      <div
                        className="h-full bg-slate-900 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : result ? (
                  <img src={result.url} alt="Result" className="max-w-full max-h-96 object-contain" loading="lazy" decoding="async" />
                ) : (
                  <p className="text-sm text-slate-400">点击"开始处理"生成结果</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              重新选择
            </button>
            {!result && (
              <button
                onClick={handleRemove}
                disabled={loading}
                className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "处理中..." : "开始处理"}
              </button>
            )}
            {result && (
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
              >
                下载 PNG
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
