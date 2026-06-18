/**
 * ExportDemo Page
 *
 * Demo for the ExportDialog — upload, then export with chosen format/quality/size.
 */

"use client";

import { useState, useRef } from "react";
import ExportDialog from "./ExportDialog";

export default function ExportDemo() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">导出格式与质量</h1>
        <p className="text-sm text-slate-500 mt-1">多格式输出 + 质量预设 + 平台尺寸</p>
      </div>

      {imageUrl ? (
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded mb-4 p-4 min-h-[300px]">
            <img src={imageUrl} alt="Selected" className="max-w-full max-h-[400px] object-contain" />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              更换图片
            </button>
            <button
              onClick={() => setShowDialog(true)}
              className="px-4 py-2 text-sm bg-slate-900 text-white rounded hover:bg-slate-800"
            >
              导出...
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setImageUrl(URL.createObjectURL(f));
            }}
            className="hidden"
            id="export-input"
          />
          <label
            htmlFor="export-input"
            className="inline-block cursor-pointer px-6 py-3 bg-slate-900 text-white rounded hover:bg-slate-800"
          >
            选择图片
          </label>
          <p className="text-xs text-slate-500 mt-3">支持 PNG / JPG / WebP</p>
        </div>
      )}

      <ExportDialog imageUrl={imageUrl} isOpen={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
}
