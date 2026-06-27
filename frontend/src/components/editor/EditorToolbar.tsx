/**
 * EditorToolbar Component
 *
 * Toolbar for image editing operations
 */

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
      <label className="flex items-center justify-between text-xs text-stone-400 mb-1">
        <span>{label}</span>
        <span>
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
        className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
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
    <div className="flex flex-col gap-4 p-4 bg-stone-800 rounded-lg">
      {/* Undo/Redo & Reset */}
      <div className="flex gap-2 pb-4 border-b border-stone-700">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex items-center gap-2 px-3 py-2 bg-stone-700 hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          title="撤销 (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span className="text-sm">撤销</span>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex items-center gap-2 px-3 py-2 bg-stone-700 hover:bg-stone-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          title="重做 (Ctrl+Y)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
          <span className="text-sm">重做</span>
        </button>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors ml-auto"
          title="重置所有编辑"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm">重置</span>
        </button>
      </div>

      {/* Crop Preset */}
      <div>
        <h3 className="text-sm font-medium text-stone-300 mb-2">裁剪比例</h3>
        <div className="grid grid-cols-5 gap-1.5">
          {CROP_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onCropPresetChange(preset.value)}
              className={`px-2 py-1.5 text-xs rounded transition-colors ${
                state.cropPreset === preset.value
                  ? "bg-amber-600 text-white"
                  : "bg-stone-700 hover:bg-stone-600 text-stone-300"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transform */}
      <div>
        <h3 className="text-sm font-medium text-stone-300 mb-2">变换</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onRotateLeft}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            <span className="text-sm">左旋转</span>
          </button>
          <button
            onClick={onRotateRight}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
            <span className="text-sm">右旋转</span>
          </button>
          <button
            onClick={onFlipHorizontal}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              state.flipHorizontal ? "bg-amber-600 hover:bg-amber-500" : "bg-stone-700 hover:bg-stone-600"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span className="text-sm">水平翻转</span>
          </button>
          <button
            onClick={onFlipVertical}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              state.flipVertical ? "bg-amber-600 hover:bg-amber-500" : "bg-stone-700 hover:bg-stone-600"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 17H4m0 0l4-4m-4 4l4 4m4-12h12m0 0l-4 4m4-4l-4-4" />
            </svg>
            <span className="text-sm">垂直翻转</span>
          </button>
        </div>
      </div>

      {/* Adjustments */}
      <div>
        <h3 className="text-sm font-medium text-stone-300 mb-2">基础调整</h3>
        <div className="space-y-3">
          <Slider label="亮度" value={state.brightness} min={0} max={200} unit="%" onChange={onBrightnessChange} />
          <Slider label="对比度" value={state.contrast} min={0} max={200} unit="%" onChange={onContrastChange} />
          <Slider label="饱和度" value={state.saturation} min={0} max={200} unit="%" onChange={onSaturationChange} />
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="text-sm font-medium text-stone-300 mb-2">色彩</h3>
        <div className="space-y-3">
          <Slider label="色温" value={state.colorTemp} min={-100} max={100} onChange={onColorTempChange} />
          <Slider label="色调" value={state.tint} min={-100} max={100} onChange={onTintChange} />
        </div>
      </div>

      {/* Sharpen */}
      <div>
        <h3 className="text-sm font-medium text-stone-300 mb-2">细节</h3>
        <Slider label="锐化" value={state.sharpen} min={0} max={100} unit="%" onChange={onSharpenChange} />
      </div>

      {/* Watermark */}
      <div>
        <h3 className="text-sm font-medium text-stone-300 mb-2">水印</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={state.watermarkEnabled}
              onChange={(e) => onWatermarkChange(state.watermarkText, e.target.checked)}
              className="w-4 h-4 rounded border-stone-600 bg-stone-700 text-amber-600 focus:ring-amber-600"
            />
            <span className="text-sm text-stone-300">启用文字水印</span>
          </label>
          {state.watermarkEnabled && (
            <input
              type="text"
              value={state.watermarkText}
              onChange={(e) => onWatermarkChange(e.target.value, true)}
              placeholder="输入水印文字"
              className="w-full px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          )}
        </div>
      </div>
    </div>
  );
}
