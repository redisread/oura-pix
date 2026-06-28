"use client";

import { useState, useRef, useEffect } from "react";
import { Save, X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[hsl(var(--foreground)/0.78)]" role="dialog" aria-modal="true">
      <div className="panel flex h-full max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-6 py-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">图片编辑器</h2>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary h-10 gap-2 px-4"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary h-10 gap-2 px-6 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {isSaving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex flex-1 items-center justify-center overflow-auto bg-[hsl(var(--foreground))] p-8">
            <div className="relative">
              <img
                src={imageUrl}
                alt="Editing"
                className="max-w-full max-h-[60vh] object-contain"
                decoding="async"
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

          <div className="w-80 overflow-y-auto border-l border-[hsl(var(--border))] bg-[hsl(var(--card))]">
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

        <div className="border-t border-[hsl(var(--border))] px-6 py-3 text-xs text-foreground-muted">
          <span>快捷键: Ctrl+Z 撤销 | Ctrl+Y/Ctrl+Shift+Z 重做</span>
        </div>
      </div>
    </div>
  );
}
