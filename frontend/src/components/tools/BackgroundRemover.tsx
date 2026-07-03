/**
 * BackgroundRemover Tool Component
 *
 * Standalone page that uses @imgly/background-removal to remove image backgrounds
 * entirely in the browser via WASM.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Download, RefreshCw, Upload, Wand2 } from "lucide-react";
import { useBackgroundRemoval } from "@/hooks/useBackgroundRemoval";
import * as m from "@/paraglide/messages.js";

import { ToolPageLayout } from "./ToolPageLayout";
import { ErrorBanner } from "@/components/ui";

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
    <ToolPageLayout
      kicker={m.tool_backgroundKicker()}
      title={m.tool_backgroundRemoverTitle()}
      subtitle={m.tool_backgroundRemoverSubtitle()}
    >{!imageUrl ? (
          <div className="drop-zone p-12 text-center">
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
              className="btn-primary h-11 cursor-pointer gap-2 px-6"
          >
              <Upload className="h-4 w-4" aria-hidden="true" />{m.common_selectImage()}</label>
            <p className="mt-3 text-xs font-medium text-foreground-muted">{m.common_supportedImageFormats()}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="panel p-4">
              <div className="panel-title mb-2">{m.tool_originalImage()}</div>
              <div className="panel-muted flex min-h-[220px] items-center justify-center p-2">
                <img src={imageUrl} alt="Original" className="max-w-full max-h-96 object-contain" loading="lazy" decoding="async" />
              </div>
            </div>

            <div className="panel p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="panel-title">{m.tool_backgroundRemoved()}</div>
                {result && (
                    <span className="font-utility text-xs text-foreground-muted">
                    {result.width} × {result.height}
                  </span>
                )}
              </div>
                <div className="checkerboard flex min-h-[220px] items-center justify-center rounded-md p-2">
                {loading ? (
                  <div className="text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">
                        <Wand2 className="h-5 w-5 animate-pulse" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{m.tool_processingWithProgress({ progress: progress.toString() })}</p>
                      <div className="mx-auto mt-3 h-1 w-32 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
                      <div
                          className="h-full bg-[hsl(var(--primary))] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                ) : result ? (
                  <img src={result.url} alt={m.tool_backgroundRemoved()} className="max-w-full max-h-96 object-contain" loading="lazy" decoding="async" />
                ) : (
                    <p className="text-sm font-medium text-foreground-muted">{m.tool_backgroundRemoverEmptyResult()}</p>
                )}
              </div>
            </div>
          </div>

          {error && <ErrorBanner message={error} />}

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleReset}
                className="btn-secondary h-10 gap-2 px-4"
            >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />{m.common_reselectImage()}</button>
            {!result && (
              <button
                onClick={handleRemove}
                disabled={loading}
                  className="btn-primary h-10 gap-2 px-4 disabled:cursor-not-allowed disabled:opacity-50"
              >
                  <Wand2 className="h-4 w-4" aria-hidden="true" />
                {loading ? m.common_processing() : m.tool_startProcessing()}
              </button>
            )}
            {result && (
              <button
                onClick={handleDownload}
                  className="btn-primary h-10 gap-2 px-4"
              >
                  <Download className="h-4 w-4" aria-hidden="true" />{m.tool_downloadPng()}</button>
            )}
          </div>
        </div>
      )}
    </ToolPageLayout>
  );
}
