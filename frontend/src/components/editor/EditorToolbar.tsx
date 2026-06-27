/**
 * EditorToolbar Component
 *
 * Toolbar for image editing operations
 */

import { FlipHorizontal, FlipVertical, RotateCcw, RotateCw, Undo2, Redo2 } from "lucide-react";
import type { EditState, CropPreset } from "@/hooks/useImageEdit";
import { CROP_PRESETS } from "@/hooks/useImageEdit";

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
        <button onClick={onUndo} disabled={!canUndo} className="btn-secondary h-10 gap-2 px-3 disabled:cursor-not-allowed disabled:opacity-50" title="撤销 (Ctrl+Z)">
          <Undo2 className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">撤销</span>
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="btn-secondary h-10 gap-2 px-3 disabled:cursor-not-allowed disabled:opacity-50" title="重做 (Ctrl+Y)">
          <Redo2 className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">重做</span>
        </button>
        <button onClick={onReset} className="btn-secondary ml-auto h-10 gap-2 px-3" title="重置所有编辑">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">重置</span>
        </button>
      </div>

      <div>
        <h3 className="panel-title mb-2">裁剪比例</h3>
        <div className="grid grid-cols-5 gap-1.5">
          {CROP_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onCropPresetChange(preset.value)}
              className={`segmented-option ${state.cropPreset === preset.value ? "segmented-option-active" : ""}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="panel-title mb-2">变换</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onRotateLeft} className="btn-secondary h-10 gap-2 px-3">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">左旋转</span>
          </button>
          <button onClick={onRotateRight} className="btn-secondary h-10 gap-2 px-3">
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">右旋转</span>
          </button>
          <button
            onClick={onFlipHorizontal}
            className={`h-10 gap-2 px-3 ${state.flipHorizontal ? "btn-primary" : "btn-secondary"}`}
          >
            <FlipHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">水平翻转</span>
          </button>
          <button
            onClick={onFlipVertical}
            className={`h-10 gap-2 px-3 ${state.flipVertical ? "btn-primary" : "btn-secondary"}`}
          >
            <FlipVertical className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">垂直翻转</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="panel-title mb-2">基础调整</h3>
        <div className="space-y-3">
          <Slider label="亮度" value={state.brightness} min={0} max={200} unit="%" onChange={onBrightnessChange} />
          <Slider label="对比度" value={state.contrast} min={0} max={200} unit="%" onChange={onContrastChange} />
          <Slider label="饱和度" value={state.saturation} min={0} max={200} unit="%" onChange={onSaturationChange} />
        </div>
      </div>

      <div>
        <h3 className="panel-title mb-2">色彩</h3>
        <div className="space-y-3">
          <Slider label="色温" value={state.colorTemp} min={-100} max={100} onChange={onColorTempChange} />
          <Slider label="色调" value={state.tint} min={-100} max={100} onChange={onTintChange} />
        </div>
      </div>

      <div>
        <h3 className="panel-title mb-2">细节</h3>
        <Slider label="锐化" value={state.sharpen} min={0} max={100} unit="%" onChange={onSharpenChange} />
      </div>

      <div>
        <h3 className="panel-title mb-2">水印</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.watermarkEnabled}
              onChange={(e) => onWatermarkChange(state.watermarkText, e.target.checked)}
              className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.28)]"
            />
            <span className="text-sm text-foreground">启用文字水印</span>
          </label>
          {state.watermarkEnabled && (
            <input
              type="text"
              value={state.watermarkText}
              onChange={(e) => onWatermarkChange(e.target.value, true)}
              placeholder="输入水印文字"
              className="input"
            />
          )}
        </div>
      </div>
    </div>
  );
}
