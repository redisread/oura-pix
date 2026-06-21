"use client";

import { useState, useRef, useEffect } from "react";
import { useImageEdit } from "@/hooks/useImageEdit";
import EditorToolbar from "./EditorToolbar";

interface ImageEditorProps {
  imageUrl: string;
  onSave?: (editedImage: Blob) => Promise<void>;
  onClose?: () => void;
}

export default function ImageEditor({ imageUrl, onSave, onClose }: ImageEditorProps) {
  const {
    state,
    canUndo,
    canRedo,
    rotateLeft,
    rotateRight,
    toggleFlipHorizontal,
    toggleFlipVertical,
    setCropPreset,
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
  } = useImageEdit();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
        } else if (e.key === "y") {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const handleSave = async () => {
    if (!canvasRef.current || !onSave) return;

    setIsSaving(true);
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          await onSave(blob);
        }
        setIsSaving(false);
      }, "image/png");
    } catch (error) {
      console.error("Failed to save image:", error);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="w-full h-full max-w-7xl max-h-[90vh] bg-stone-900 rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
          <h2 className="text-xl font-semibold text-stone-100">图片编辑器</h2>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-300 hover:text-stone-100 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isSaving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-8 bg-stone-950 overflow-auto">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Editing"
                className="max-w-full max-h-[60vh] object-contain"
                style={{
                  transform: getTransformStyle(),
                  filter: getFilterStyle(),
                }}
                onLoad={() => setImageLoaded(true)}
              />
              {state.watermarkEnabled && state.watermarkText && imageLoaded && (
                <div
                  className="absolute bottom-4 right-4 text-white/50 text-2xl font-bold pointer-events-none"
                  style={{
                    textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                  }}
                >
                  {state.watermarkText}
                </div>
              )}
            </div>
          </div>

          {/* Toolbar Sidebar */}
          <div className="w-80 border-l border-stone-700 overflow-y-auto">
            <EditorToolbar
              state={state}
              canUndo={canUndo}
              canRedo={canRedo}
              onRotateLeft={rotateLeft}
              onRotateRight={rotateRight}
              onFlipHorizontal={toggleFlipHorizontal}
              onFlipVertical={toggleFlipVertical}
              onCropPresetChange={setCropPreset}
              onBrightnessChange={setBrightness}
              onContrastChange={setContrast}
              onSaturationChange={setSaturation}
              onColorTempChange={setColorTemp}
              onTintChange={setTint}
              onSharpenChange={setSharpen}
              onWatermarkChange={setWatermark}
              onReset={reset}
              onUndo={undo}
              onRedo={redo}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 border-t border-stone-700 text-xs text-stone-500">
          <span>快捷键: Ctrl+Z 撤销 | Ctrl+Y/Ctrl+Shift+Z 重做</span>
        </div>
      </div>
    </div>
  );
}
