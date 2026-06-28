/**
 * CompareView Component
 *
 * Main comparison view with zoom, pan, fullscreen, and keyboard support
 */

import { useEffect, useCallback, useRef, useState } from "react";
import * as m from "@/paraglide/messages.js";
import { useCompare, type CompareImage } from "@/hooks/useCompare";
import CompareGrid from "./CompareGrid";
import CompareToolbar from "./CompareToolbar";

interface CompareViewProps {
  images: CompareImage[];
  onClose: () => void;
}

export default function CompareView({ images, onClose }: CompareViewProps) {
  const {
    currentIndex,
    layout,
    zoom,
    panX,
    panY,
    isFullscreen,
    setCurrentIndex,
    setLayout,
    zoomIn,
    zoomOut,
    resetZoom,
    pan,
    resetPan,
    toggleFullscreen,
    nextImage,
    prevImage,
    canNext,
    canPrev,
  } = useCompare(images);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset view when layout changes to single
  useEffect(() => {
    if (layout === "single") {
      resetZoom();
      resetPan();
    }
  }, [layout, resetZoom, resetPan]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (layout === "single") prevImage();
          break;
        case "ArrowRight":
          if (layout === "single") nextImage();
          break;
        case "+":
        case "=":
          zoomIn();
          break;
        case "-":
          zoomOut();
          break;
        case "0":
          resetZoom();
          resetPan();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, prevImage, nextImage, zoomIn, zoomOut, resetZoom, resetPan, toggleFullscreen, layout]);

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    },
    [zoomIn, zoomOut]
  );

  // Pan - mouse drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    },
    [panX, panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x - panX;
      const dy = e.clientY - dragStart.y - panY;
      pan(dx, dy);
      setDragStart({ x: e.clientX - panX - dx + dx, y: e.clientY - panY - dy + dy });
    },
    [isDragging, dragStart, panX, panY, pan]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleResetView = useCallback(() => {
    resetZoom();
    resetPan();
  }, [resetZoom, resetPan]);

  // Prevent default on wheel to avoid page scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventDefault = (e: WheelEvent) => {
      e.preventDefault();
    };

    container.addEventListener("wheel", preventDefault, { passive: false });
    return () => container.removeEventListener("wheel", preventDefault);
  }, []);

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 flex flex-col bg-stone-900 ${
        isFullscreen ? "" : "p-4"
      }`}
    >
      {/* Toolbar */}
      <CompareToolbar
        layout={layout}
        onLayoutChange={setLayout}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={handleResetView}
        onFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        currentIndex={currentIndex}
        totalImages={images.length}
        onPrev={prevImage}
        onNext={nextImage}
        canPrev={canPrev}
        canNext={canNext}
        onClose={onClose}
      />

      {/* Image Grid */}
      <div className="flex-1 p-4 overflow-hidden">
        <CompareGrid
          images={images}
          layout={layout}
          zoom={zoom}
          panX={panX}
          panY={panY}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          currentIndex={currentIndex}
          onSelectImage={setCurrentIndex}
        />
      </div>

      {/* Help Text */}
      <div className="px-4 py-2 bg-stone-800 border-t border-stone-700 text-xs text-stone-400 flex items-center justify-center gap-4">
        <span>{m.compare_helpWheel()}</span>
        <span>{m.compare_helpDrag()}</span>
        <span>{m.compare_helpArrow()}</span>
        <span>{m.compare_helpZoom()}</span>
        <span>{m.compare_helpFullscreen()}</span>
        <span>{m.compare_helpEsc()}</span>
      </div>
    </div>
  );
}
