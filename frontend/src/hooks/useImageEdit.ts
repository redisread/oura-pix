/**
 * useImageEdit Hook
 *
 * State management for image editing operations
 */

import { useState, useCallback } from "react";

export interface EditState {
  // Crop
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;

  // Rotation
  rotation: number;

  // Flip
  flipHorizontal: boolean;
  flipVertical: boolean;

  // Adjustments
  brightness: number;
  contrast: number;
  saturation: number;

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
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  watermarkText: "",
  watermarkEnabled: false,
};

interface UseImageEditReturn {
  state: EditState;
  history: EditHistory;
  canUndo: boolean;
  canRedo: boolean;
  setCrop: (x: number, y: number, width: number, height: number) => void;
  setRotation: (degrees: number) => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  toggleFlipHorizontal: () => void;
  toggleFlipVertical: () => void;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;
  setWatermark: (text: string, enabled: boolean) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
  getTransformStyle: () => string;
  getFilterStyle: () => string;
}

export function useImageEdit(_initialImageWidth = 800, _initialImageHeight = 600): UseImageEditReturn {
  const [state, setState] = useState<EditState>({
    ...DEFAULT_STATE,
    cropWidth: 100,
    cropHeight: 100,
  });

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
    if (state.contrast !== 100) filters.push(`contrast(${state.contrast}%)`);
    if (state.saturation !== 100) filters.push(`saturate(${state.saturation}%)`);
    return filters.join(" ");
  }, [state]);

  return {
    state,
    history,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    setCrop,
    setRotation,
    rotateLeft,
    rotateRight,
    toggleFlipHorizontal,
    toggleFlipVertical,
    setBrightness,
    setContrast,
    setSaturation,
    setWatermark,
    reset,
    undo,
    redo,
    getTransformStyle,
    getFilterStyle,
  };
}
