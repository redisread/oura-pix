/**
 * BatchProcessor Tool Component
 *
 * Batch image processing: resize, compress, watermark, format conversion.
 * All client-side via Canvas API.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useBatchProcess, type OutputFormat, type BatchItem } from "@/hooks/useBatchProcess";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function BatchProcessor() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
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
  } = useBatchProcess();
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      // Revoke URLs on unmount
      items.forEach((item) => {
        URL.revokeObjectURL(item.originalUrl);
        if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    addFiles(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const completedCount = items.filter((i) => i.status === "done").length;
  const totalSavings = items.reduce((acc, i) => {
    if (i.status === "done" && i.resultSize > 0) {
      return acc + (i.originalSize - i.resultSize);
    }
    return acc;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">批量处理工具</h1>
        <p className="text-sm text-slate-500 mt-1">
          浏览器内批量处理图片：调整尺寸、压缩、添加水印、格式转换。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Options panel */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4">
          <h2 className="text-sm font-medium text-slate-700 dark:text-slate-300">处理选项</h2>

          <div>
            <label className="block text-xs text-slate-500 mb-1">输出格式</label>
            <select
              value={options.format}
              onChange={(e) => setOptions({ ...options, format: e.target.value as OutputFormat })}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500 mb-1">宽 (px)</label>
              <input
                type="number"
                value={options.resizeWidth ?? ""}
                onChange={(e) => setOptions({ ...options, resizeWidth: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="原图"
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">高 (px)</label>
              <input
                type="number"
                value={options.resizeHeight ?? ""}
                onChange={(e) => setOptions({ ...options, resizeHeight: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="原图"
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          {options.format !== "image/png" && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>质量</span>
                <span>{Math.round(options.quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={options.quality}
                onChange={(e) => setOptions({ ...options, quality: Number(e.target.value) })}
                className="w-full accent-slate-900"
              />
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.watermarkEnabled}
                onChange={(e) => setOptions({ ...options, watermarkEnabled: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">添加水印</span>
            </label>
            {options.watermarkEnabled && (
              <input
                type="text"
                value={options.watermarkText}
                onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
                placeholder="水印文字"
                className="w-full px-2 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              />
            )}
          </div>

          <button
            onClick={processAll}
            disabled={items.length === 0 || processing}
            className="w-full px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
          >
            {processing ? `处理中 ${progress}%` : `开始处理 (${items.length})`}
          </button>

          {completedCount > 0 && (
            <button
              onClick={downloadZip}
              className="w-full px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              下载 ZIP ({completedCount})
            </button>
          )}
        </div>

        {/* File list / drop zone */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800/50"
                : "border-slate-300 dark:border-slate-700"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              id="batch-input"
            />
            <label
              htmlFor="batch-input"
              className="inline-block cursor-pointer px-4 py-2 bg-slate-900 text-white text-sm rounded hover:bg-slate-800"
            >
              选择多张图片
            </label>
            <p className="text-xs text-slate-500 mt-2">或拖放图片到这里</p>
          </div>

          {items.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-sm">
                  共 {items.length} 张 · 完成 {completedCount}
                  {totalSavings > 0 && ` · 节省 ${formatBytes(totalSavings)}`}
                </div>
                <button
                  onClick={clearAll}
                  className="text-xs text-slate-500 hover:text-red-500"
                >
                  清空
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-y-auto">
                {items.map((item) => (
                  <BatchItemRow key={item.id} item={item} onRemove={removeItem} onDownload={downloadOne} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BatchItemRow({ item, onRemove, onDownload }: { item: BatchItem; onRemove: (id: string) => void; onDownload: (item: BatchItem) => void }) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden flex-shrink-0">
        <img src={item.resultUrl ?? item.originalUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {item.file.name}
        </div>
        <div className="text-xs text-slate-500">
          {item.status === "done" ? (
            <>
              {item.width}×{item.height} · {formatBytes(item.originalSize)} → {formatBytes(item.resultSize)}
            </>
          ) : (
            <>{formatBytes(item.originalSize)}</>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded ${
          item.status === "done" ? "bg-green-100 text-green-700" :
          item.status === "error" ? "bg-red-100 text-red-700" :
          item.status === "processing" ? "bg-blue-100 text-blue-700" :
          "bg-slate-100 text-slate-700"
        }`}>
          {item.status === "done" ? "完成" : item.status === "error" ? "失败" : item.status === "processing" ? "处理中" : "等待"}
        </span>
        {item.status === "done" && (
          <button
            onClick={() => onDownload(item)}
            className="text-xs text-blue-600 hover:underline"
          >
            下载
          </button>
        )}
        <button
          onClick={() => onRemove(item.id)}
          className="text-slate-400 hover:text-red-500"
          aria-label="Remove"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
