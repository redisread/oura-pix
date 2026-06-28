/**
 * EditorToolbar Component
 *
 * Toolbar for image editing operations
 */

import { FlipHorizontal, FlipVertical, RotateCcw, RotateCw, Undo2, Redo2 } from "lucide-react";
import type { EditState, CropPreset } from "@/hooks/useImageEdit";
import { CROP_PRESETS, getCropPresetLabel } from "@/hooks/useImageEdit";
import * as m from "@/paraglide/messages.js";

interface EditorToolbarProps {
  state: EditState;
  canUndo: boolean;
  canRedo: boolean;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onCropPresetChange: (preset: CropPreset) => void;
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onSaturationChange: (value: number) => void;
  onColorTempChange: (value: number) => void;
  onTintChange: (value: number) => void;
  onSharpenChange: (value: number) => void;
  onWatermarkChange: (text: string, enabled: boolean) => void;
  onReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center justify-between text-xs text-foreground-muted">
        <span>{label}</span>
        <span className="font-utility">
          {value > 0 ? "+" : ""}
          {value}
          {unit ?? ""}
        </span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range"
      />
    </div>
  );
}

export default function EditorToolbar({
  state,
  canUndo,
  canRedo,
  onRotateLeft,
  onRotateRight,
  onFlipHorizontal,
  onFlipVertical,
  onCropPresetChange,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  onColorTempChange,
  onTintChange,
  onSharpenChange,
  onWatermarkChange,
  onReset,
  onUndo,
  onRedo,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-2 border-b border-[hsl(var(--border))] pb-4">
        <button onClick={onUndo} disabled={!canUndo} className="btn-secondary h-10 gap-2 px-3 disabled:cursor-not-allowed disabled:opacity-50" title={m.tool_actionUndo()}>
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">{m.editor_undo()}</span>
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="btn-secondary h-10 gap-2 px-3 disabled:cursor-not-allowed disabled:opacity-50" title={m.editor_redoTitle()}>
          <Redo2 className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">{m.editor_redo()}</span>
        </button>
        <button onClick={onReset} className="btn-secondary ml-auto h-10 gap-2 px-3" title={m.editor_resetAllTitle()}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">{m.editor_reset()}</span>
        </button>
      </div>

      <div>
        <h3 className="panel-title mb-2">{m.editor_cropRatio()}</h3>
        <div className="grid grid-cols-5 gap-1.5">
          {CROP_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onCropPresetChange(preset.value)}
              className={`segmented-option ${state.cropPreset === preset.value ? "segmented-option-active" : ""}`}
            >
              {getCropPresetLabel(preset.value)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="panel-title mb-2">{m.editor_transform()}</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onRotateLeft} className="btn-secondary h-10 gap-2 px-3">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">{m.editor_rotateLeft()}</span>
          </button>
          <button onClick={onRotateRight} className="btn-secondary h-10 gap-2 px-3">
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">{m.editor_rotateRight()}</span>
          </button>
          <button
            onClick={onFlipHorizontal}
            className={`h-10 gap-2 px-3 ${state.flipHorizontal ? "btn-primary" : "btn-secondary"}`}
          >
            <FlipHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">{m.editor_flipHorizontal()}</span>
          </button>
          <button
            onClick={onFlipVertical}
            className={`h-10 gap-2 px-3 ${state.flipVertical ? "btn-primary" : "btn-secondary"}`}
          >
            <FlipVertical className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">{m.editor_flipVertical()}</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="panel-title mb-2">{m.editor_basicAdjustments()}</h3>
        <div className="space-y-3">
          <Slider label={m.editor_brightness()} value={state.brightness} min={0} max={200} unit="%" onChange={onBrightnessChange} />
          <Slider label={m.editor_contrast()} value={state.contrast} min={0} max={200} unit="%" onChange={onContrastChange} />
          <Slider label={m.editor_saturation()} value={state.saturation} min={0} max={200} unit="%" onChange={onSaturationChange} />
        </div>
      </div>

      <div>
        <h3 className="panel-title mb-2">{m.editor_color()}</h3>
        <div className="space-y-3">
          <Slider label={m.editor_colorTemp()} value={state.colorTemp} min={-100} max={100} onChange={onColorTempChange} />
          <Slider label={m.editor_tint()} value={state.tint} min={-100} max={100} onChange={onTintChange} />
        </div>
      </div>

      <div>
        <h3 className="panel-title mb-2">{m.editor_details()}</h3>
        <Slider label={m.editor_sharpen()} value={state.sharpen} min={0} max={100} unit="%" onChange={onSharpenChange} />
      </div>

      <div>
        <h3 className="panel-title mb-2">{m.editor_watermark()}</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.watermarkEnabled}
              onChange={(e) => onWatermarkChange(state.watermarkText, e.target.checked)}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.28)]"
            />
            <span className="text-sm text-foreground">{m.editor_enableWatermark()}</span>
          </label>
          {state.watermarkEnabled && (
            <input
              type="text"
              value={state.watermarkText}
              onChange={(e) => onWatermarkChange(e.target.value, true)}
              placeholder={m.editor_watermarkPlaceholder()}
              className="input"
            />
          )}
        </div>
      </div>
    </div>
  );
}
