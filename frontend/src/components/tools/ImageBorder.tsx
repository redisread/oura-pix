/**
 * ImageBorder Tool Component
 *
 * Apply preset borders, drop shadows, and decorative badges to an image.
 */

"use client";

import { useRef } from "react";
import { Download, ImagePlus } from "lucide-react";
import {
  BADGES,
  BORDER_STYLES,
  getBadgeLabel,
  getBorderStyleLabel,
  useImageBorder,
  type BadgeStyle,
  type BorderStyle,
} from "@/hooks/useImageBorder";
import * as m from "@/paraglide/messages.js";

import { ToolPageLayout } from "./ToolPageLayout";

export default function ImageBorder() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { options, setOptions, imageUrl, setImage, canvasRef, previewUrl, exporting, download } = useImageBorder();

  return (
    <ToolPageLayout
      kicker={m.tool_borderKicker()}
      title={m.tool_borderTitle()}
      subtitle={m.tool_borderSubtitle()}
    ><div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="panel space-y-4 p-4">
          <div>
              <h2 className="panel-title mb-2">{m.tool_borderStyle()}</h2>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setOptions({ ...options, borderStyle: "none" })}
                  className={`segmented-option ${options.borderStyle === "none" ? "segmented-option-active" : ""}`}
              >
                {m.tool_none()}
              </button>
              {(Object.keys(BORDER_STYLES) as Exclude<BorderStyle, "none">[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setOptions({ ...options, borderStyle: key })}
                    className={`segmented-option ${options.borderStyle === key ? "segmented-option-active" : ""}`}
                >
                  {getBorderStyleLabel(key)}
                </button>
              ))}
            </div>
          </div>

          {options.borderStyle !== "none" && (
            <>
              <div>
                  <label className="panel-label mb-1 block">{m.tool_borderColor()}</label>
                <input
                  type="color"
                  value={options.borderColor}
                  onChange={(e) => setOptions({ ...options, borderColor: e.target.value })}
                    className="swatch"
                    aria-label={m.tool_borderColorAria()}
                />
              </div>

              <div>
                  <div className="mb-1 flex justify-between text-xs font-medium text-foreground-muted">
                  <span>{m.tool_padding()}</span>
                  <span>{options.outputPadding}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={options.outputPadding}
                  onChange={(e) => setOptions({ ...options, outputPadding: Number(e.target.value) })}
                    className="range"
                    aria-label={m.tool_borderPaddingAria()}
                />
              </div>
            </>
          )}

            <div className="border-t border-[hsl(var(--border))] pt-4">
              <h2 className="panel-title mb-2">{m.tool_badge()}</h2>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setOptions({ ...options, badge: "none" })}
                  className={`segmented-option ${options.badge === "none" ? "segmented-option-active" : ""}`}
              >
                {m.tool_none()}
              </button>
              {(Object.keys(BADGES) as Exclude<BadgeStyle, "none">[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setOptions({ ...options, badge: key })}
                    className={`segmented-option ${options.badge === key ? "segmented-option-active" : ""}`}
                >
                  {getBadgeLabel(key)}
                </button>
              ))}
            </div>
          </div>

          {options.badge !== "none" && (
            <>
              <div>
                  <h3 className="panel-label mb-1">{m.tool_position()}</h3>
                <div className="grid grid-cols-4 gap-1">
                  {(["tl", "tr", "bl", "br"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setOptions({ ...options, badgePosition: pos })}
                        className={`segmented-option h-8 ${options.badgePosition === pos ? "segmented-option-active" : ""}`}
                        aria-label={m.tool_badgePositionAria({ position: pos })}
                    >
                      {pos === "tl" ? "↖" : pos === "tr" ? "↗" : pos === "bl" ? "↙" : "↘"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                  <div className="mb-1 flex justify-between text-xs font-medium text-foreground-muted">
                  <span>{m.tool_size()}</span>
                  <span>{options.badgeSize}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="120"
                  value={options.badgeSize}
                  onChange={(e) => setOptions({ ...options, badgeSize: Number(e.target.value) })}
                    className="range"
                    aria-label={m.tool_badgeSizeAria()}
                />
              </div>
            </>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
              className="btn-primary h-10 w-full gap-2"
          >
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {imageUrl ? m.common_changeImage() : m.common_selectImage()}
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
                className="btn-secondary h-10 w-full gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Download className="h-4 w-4" aria-hidden="true" />
              {exporting ? m.tool_exporting() : m.tool_downloadPng()}
            </button>
          )}
        </div>

        <div className="lg:col-span-2">
            <div className="panel p-4">
              <div className="panel-muted flex min-h-[500px] items-center justify-center">
              <canvas ref={canvasRef} className="hidden" />
              {previewUrl ? (
                <img src={previewUrl} alt={m.tool_preview()} className="max-w-full max-h-[600px] object-contain" loading="lazy" decoding="async" />
              ) : (
                  <p className="p-12 text-center text-sm font-medium text-foreground-muted">{m.tool_uploadImageStart()}<br />
                  <span className="text-xs">{m.common_supportedImageFormats()}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolPageLayout>
  );
}
