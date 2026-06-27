/**
 * useImageEdit Hook
 *
 * State management for image editing operations
 */

import { useState, useCallback, type CSSProperties } from "react";

export type CropPreset = "free" | "1:1" | "3:4" | "4:3" | "16:9";

export const CROP_PRESETS: Array<{ value: CropPreset; label: string; ratio: number | null }> = [
  { value: "free", label: "自由", ratio: null },
  { value: "1:1", label: "1:1", ratio: 1 },
  { value: "3:4", label: "3:4", ratio: 3 / 4 },
  { value: "4:3", label: "4:3", ratio: 4 / 3 },
  { value: "16:9", label: "16:9", ratio: 16 / 9 },
];

export interface EditState {
  // Crop
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  cropPreset: CropPreset;

  // Rotation
  rotation: number;

  // Flip
  flipHorizontal: boolean;
  flipVertical: boolean;

  // Adjustments
  brightness: number;
  contrast: number;
  saturation: number;
  // 色温（暖/冷）：-100 冷色，0 中性，+100 暖色
  colorTemp: number;
  // 色调：-100 绿，0 中性，+100 紫红
  tint: number;
  // 锐化 0-100 (CSS filter: contrast + brightness 微调模拟)
  sharpen: number;

  // Watermark
  watermarkText: string;
  watermarkEnabled: boolean;
}

export interface EditHistory {
  past: EditState[];
  future: EditState[];
}

const DEFAULT_STATE: EditState = {
  cropX: 0,
  cropY: 0,
  cropWidth: 100,
  cropHeight: 100,
  cropPreset: "free",
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  colorTemp: 0,
  tint: 0,
  sharpen: 0,
  watermarkText: "",
  watermarkEnabled: false,
};

interface UseImageEditReturn {
  state: EditState;
  history: EditHistory;
  canUndo: boolean;
  canRedo: boolean;
  setCrop: (x: number, y: number, width: number, height: number) => void;
  setCropPreset: (preset: CropPreset) => void;
  setRotation: (degrees: number) => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  toggleFlipHorizontal: () => void;
  toggleFlipVertical: () => void;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;
  setColorTemp: (value: number) => void;
  setTint: (value: number) => void;
  setSharpen: (value: number) => void;
  setWatermark: (text: string, enabled: boolean) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  getTransformStyle: () => string;
  getFilterStyle: () => string;
  getCropStyle: () => CSSProperties;
}

export function useImageEdit(_initialImageWidth = 800, _initialImageHeight = 600): UseImageEditReturn {
  const [state, setState] = useState<EditState>({ ...DEFAULT_STATE });

  const [history, setHistory] = useState<EditHistory>({
    past: [],
    future: [],
  });

  const pushHistory = useCallback((newState: EditState) => {
    setHistory((prev) => ({
      past: [...prev.past, state],
      future: [],
    }));
    setState(newState);
  }, [state]);

  const setCrop = useCallback((x: number, y: number, width: number, height: number) => {
    pushHistory({ ...state, cropX: x, cropY: y, cropWidth: width, cropHeight: height });
  }, [state, pushHistory]);

  const setCropPreset = useCallback((preset: CropPreset) => {
    pushHistory({ ...state, cropPreset: preset });
  }, [state, pushHistory]);

  const setRotation = useCallback((degrees: number) => {
    pushHistory({ ...state, rotation: degrees });
  }, [state, pushHistory]);

  const rotateLeft = useCallback(() => {
    pushHistory({ ...state, rotation: (state.rotation - 90) % 360 });
  }, [state, pushHistory]);

  const rotateRight = useCallback(() => {
    pushHistory({ ...state, rotation: (state.rotation + 90) % 360 });
  }, [state, pushHistory]);

  const toggleFlipHorizontal = useCallback(() => {
    pushHistory({ ...state, flipHorizontal: !state.flipHorizontal });
  }, [state, pushHistory]);

  const toggleFlipVertical = useCallback(() => {
    pushHistory({ ...state, flipVertical: !state.flipVertical });
  }, [state, pushHistory]);

  const setBrightness = useCallback((value: number) => {
    pushHistory({ ...state, brightness: value });
  }, [state, pushHistory]);

  const setContrast = useCallback((value: number) => {
    pushHistory({ ...state, contrast: value });
  }, [state, pushHistory]);

  const setSaturation = useCallback((value: number) => {
    pushHistory({ ...state, saturation: value });
  }, [state, pushHistory]);

  const setColorTemp = useCallback((value: number) => {
    pushHistory({ ...state, colorTemp: value });
  }, [state, pushHistory]);

  const setTint = useCallback((value: number) => {
    pushHistory({ ...state, tint: value });
  }, [state, pushHistory]);

  const setSharpen = useCallback((value: number) => {
    pushHistory({ ...state, sharpen: value });
  }, [state, pushHistory]);

  const setWatermark = useCallback((text: string, enabled: boolean) => {
    pushHistory({ ...state, watermarkText: text, watermarkEnabled: enabled });
  }, [state, pushHistory]);

  const reset = useCallback(() => {
    pushHistory(DEFAULT_STATE);
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    const previous = history.past[history.past.length - 1];
    setHistory({
      past: history.past.slice(0, -1),
      future: [state, ...history.future],
    });
    setState(previous);
  }, [history, state]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    const next = history.future[0];
    setHistory({
      past: [...history.past, state],
      future: history.future.slice(1),
    });
    setState(next);
  }, [history, state]);

  const getTransformStyle = useCallback(() => {
    const transforms = [];
    if (state.rotation !== 0) transforms.push(`rotate(${state.rotation}deg)`);
    if (state.flipHorizontal) transforms.push("scaleX(-1)");
    if (state.flipVertical) transforms.push("scaleY(-1)");
    return transforms.join(" ");
  }, [state]);

  const getFilterStyle = useCallback(() => {
    const filters = [];
    if (state.brightness !== 100) filters.push(`brightness(${state.brightness}%)`);
    if (state.contrast !== 100 || state.sharpen > 0) {
      // Sharpen 0-100: 映射到 contrast 100-160
      const contrastValue = state.contrast + state.sharpen * 0.6;
      filters.push(`contrast(${contrastValue}%)`);
    }
    if (state.saturation !== 100) filters.push(`saturate(${state.saturation}%)`);
    // 色温：用 sepia (warm) 或 hue-rotate (cool) 模拟
    if (state.colorTemp !== 0) {
      // warm: sepia; cool: hue-rotate 180
      if (state.colorTemp > 0) {
        filters.push(`sepia(${Math.min(state.colorTemp, 100) / 100})`);
      } else {
        filters.push(`hue-rotate(${state.colorTemp}deg)`);
      }
    }
    // 色调：hue-rotate 模拟
    if (state.tint !== 0) {
      filters.push(`hue-rotate(${state.tint * 0.3}deg)`);
    }
    return filters.join(" ");
  }, [state]);

  const getCropStyle = useCallback(() => {
    // Returns inline style for cropping: use object-position with object-fit cover
    return {
      objectFit: "cover" as const,
      objectPosition: `${state.cropX + state.cropWidth / 2}% ${state.cropY + state.cropHeight / 2}%`,
    };
  }, [state.cropX, state.cropY, state.cropWidth, state.cropHeight]);

  return {
    state,
    history,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    setCrop,
    setCropPreset,
    setRotation,
    rotateLeft,
    rotateRight,
    toggleFlipHorizontal,
    toggleFlipVertical,
    setBrightness,
    setContrast,
    setSaturation,
    setColorTemp,
    setTint,
    setSharpen,
    setWatermark,
    reset,
    undo,
    redo,
    getTransformStyle,
    getFilterStyle,
    getCropStyle,
  };
}
