/**
 * BatchProcessor Tool Component
 *
 * Batch image processing: resize, compress, watermark, format conversion.
 * All client-side via Canvas API.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Download, PackageOpen, Trash2, Upload, Wand2, X } from "lucide-react";
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
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-8 max-w-3xl">
          <p className="page-kicker">Tool bench / Batch</p>
          <h1 className="page-title mt-2">批量处理工具</h1>
          <p className="page-description mt-3">
          浏览器内批量处理图片：调整尺寸、压缩、添加水印、格式转换。
        </p>
        </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="panel space-y-4 p-4">
            <h2 className="panel-title">处理选项</h2>

          <div>
              <label className="panel-label mb-1 block">输出格式</label>
            <select
              value={options.format}
              onChange={(e) => setOptions({ ...options, format: e.target.value as OutputFormat })}
                className="input py-1.5"
            >
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="panel-label mb-1 block">宽 (px)</label>
              <input
                type="number"
                value={options.resizeWidth ?? ""}
                onChange={(e) => setOptions({ ...options, resizeWidth: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="原图"
                  className="input py-1.5"
              />
            </div>
            <div>
                <label className="panel-label mb-1 block">高 (px)</label>
              <input
                type="number"
                value={options.resizeHeight ?? ""}
                onChange={(e) => setOptions({ ...options, resizeHeight: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="原图"
                  className="input py-1.5"
              />
            </div>
          </div>

          {options.format !== "image/png" && (
            <div>
                <div className="mb-1 flex justify-between text-xs font-medium text-foreground-muted">
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
                  className="range"
                  aria-label="输出质量"
              />
            </div>
          )}

            <div className="space-y-2 border-t border-[hsl(var(--border))] pt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={options.watermarkEnabled}
                onChange={(e) => setOptions({ ...options, watermarkEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.28)]"
              />
                <span className="text-sm font-medium text-foreground">添加水印</span>
            </label>
            {options.watermarkEnabled && (
              <input
                type="text"
                value={options.watermarkText}
                onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
                placeholder="水印文字"
                  className="input py-1.5"
              />
            )}
          </div>

          <button
            onClick={processAll}
            disabled={items.length === 0 || processing}
              className="btn-primary h-10 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
              <Wand2 className="h-4 w-4" aria-hidden="true" />
            {processing ? `处理中 ${progress}%` : `开始处理 (${items.length})`}
          </button>

          {completedCount > 0 && (
            <button
              onClick={downloadZip}
                className="btn-secondary h-10 w-full gap-2"
            >
                <Download className="h-4 w-4" aria-hidden="true" />
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
              className={`drop-zone p-8 text-center ${dragActive ? "drop-zone-active" : ""}`}
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
                className="btn-primary h-10 cursor-pointer gap-2 px-4"
            >
                <Upload className="h-4 w-4" aria-hidden="true" />
              选择多张图片
            </label>
              <p className="mt-2 text-xs font-medium text-foreground-muted">或拖放图片到这里</p>
          </div>

          {items.length > 0 && (
              <div className="panel overflow-hidden">
                <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
                  <div className="text-sm font-semibold text-foreground">
                  共 {items.length} 张 · 完成 {completedCount}
                  {totalSavings > 0 && ` · 节省 ${formatBytes(totalSavings)}`}
                </div>
                <button
                  onClick={clearAll}
                    className="icon-button h-8 gap-1 px-2 text-xs"
                >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  清空
                </button>
              </div>
                <div className="max-h-[500px] overflow-y-auto">
                {items.map((item) => (
                  <BatchItemRow key={item.id} item={item} onRemove={removeItem} onDownload={downloadOne} />
                ))}
              </div>
            </div>
          )}
            {items.length === 0 && (
              <div className="panel-muted flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
                <PackageOpen className="mb-4 h-10 w-10 text-foreground-muted" aria-hidden="true" />
                <p className="font-semibold text-foreground">还没有待处理图片</p>
                <p className="mt-1 text-sm text-foreground-muted">选择或拖入图片后，这里会显示处理队列。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BatchItemRow({ item, onRemove, onDownload }: { item: BatchItem; onRemove: (id: string) => void; onDownload: (item: BatchItem) => void }) {
  return (
    <div className="data-row flex items-center gap-3 px-4 py-3">
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-[hsl(var(--secondary))]">
        <img src={item.resultUrl ?? item.originalUrl} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold text-foreground">
          {item.file.name}
        </div>
        <div className="font-utility text-xs text-foreground-muted">
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
        <span className={`status-badge ${
          item.status === "done" ? "status-badge-success" :
          item.status === "error" ? "status-badge-error" :
          item.status === "processing" ? "status-badge-info" :
          "status-badge-neutral"
        }`}>
          {item.status === "done" ? "完成" : item.status === "error" ? "失败" : item.status === "processing" ? "处理中" : "等待"}
        </span>
        {item.status === "done" && (
          <button
            onClick={() => onDownload(item)}
            className="icon-button h-8 gap-1 px-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            下载
          </button>
        )}
        <button
          onClick={() => onRemove(item.id)}
          className="icon-button h-8 w-8 hover:text-[hsl(var(--color-error))]"
          aria-label="Remove image"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
