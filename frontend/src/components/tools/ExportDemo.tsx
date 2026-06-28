/**
 * ExportDemo Page
 *
 * Demo for the ExportDialog — upload, then export with chosen format/quality/size.
 */

"use client";

import { useState, useRef } from "react";
import { Download, ImagePlus, Replace } from "lucide-react";
import ExportDialog from "./ExportDialog";
import * as m from "@/paraglide/messages.js";

export default function ExportDemo() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="workbench-page">
      <div className="workbench-container max-w-4xl">
        <header className="mb-8 max-w-3xl">
          <p className="page-kicker">{m.tool_exportKicker()}</p>
          <h1 className="page-title mt-2">{m.tool_exportTitle()}</h1>
          <p className="page-description mt-3">{m.tool_exportSubtitle()}</p>
        </header>

      {imageUrl ? (
          <div className="panel p-6">
            <div className="panel-muted mb-4 flex min-h-[320px] items-center justify-center p-4">
            <img src={imageUrl} alt="Selected" className="max-w-full max-h-[400px] object-contain" loading="lazy" decoding="async" />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => fileInputRef.current?.click()}
                className="btn-secondary h-10 gap-2 px-4"
            >
                <Replace className="h-4 w-4" aria-hidden="true" />{m.common_changeImage()}</button>
            <button
              onClick={() => setShowDialog(true)}
                className="btn-primary h-10 gap-2 px-4"
            >
                <Download className="h-4 w-4" aria-hidden="true" />{m.tool_exportAction()}</button>
          </div>
        </div>
      ) : (
          <div className="drop-zone p-12 text-center">
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
              className="btn-primary h-11 cursor-pointer gap-2 px-6"
          >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />{m.common_selectImage()}</label>
            <p className="mt-3 text-xs font-medium text-foreground-muted">{m.common_supportedImageFormats()}</p>
        </div>
      )}

      <ExportDialog imageUrl={imageUrl} isOpen={showDialog} onClose={() => setShowDialog(false)} />
      </div>
    </div>
  );
}
