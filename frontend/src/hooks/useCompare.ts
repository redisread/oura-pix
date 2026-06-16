/**
 * useCompare Hook
 *
 * State management for image comparison view
 */

import { useState, useCallback, useEffect, useRef } from "react";

export interface CompareImage {
  id: string;
  url: string;
  title?: string;
  generationId: string;
}

export type LayoutMode = "grid-2x2" | "grid-1x4" | "grid-4x1" | "single";

interface CompareState {
  images: CompareImage[];
  currentIndex: number;
  layout: LayoutMode;
  zoom: number;
  panX: number;
  panY: number;
  isFullscreen: boolean;
}

interface UseCompareReturn extends CompareState {
  setImages: (images: CompareImage[]) => void;
  setCurrentIndex: (index: number) => void;
  setLayout: (layout: LayoutMode) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  pan: (dx: number, dy: number) => void;
  resetPan: () => void;
  toggleFullscreen: () => void;
  nextImage: () => void;
  prevImage: () => void;
  canNext: boolean;
  canPrev: boolean;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

export function useCompare(initialImages: CompareImage[] = []): UseCompareReturn {
  const [images, setImages] = useState<CompareImage[]>(initialImages);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [layout, setLayout] = useState<LayoutMode>("grid-2x2");
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const pan = useCallback((dx: number, dy: number) => {
    setPanX((x) => x + dx);
    setPanY((y) => y + dy);
  }, []);

  const resetPan = useCallback(() => {
    setPanX(0);
    setPanY(0);
  }, []);

  const nextImage = useCallback(() => {
    setCurrentIndex((i) => Math.min(images.length - 1, i + 1));
  }, [images.length]);

  const prevImage = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const canNext = currentIndex < images.length - 1;
  const canPrev = currentIndex > 0;

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fullscreen not supported or denied
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch {
        // Exit failed
      }
    }
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Reset zoom/pan when images change
  useEffect(() => {
    resetZoom();
    resetPan();
    setCurrentIndex(0);
  }, [images, resetZoom, resetPan]);

  return {
    images,
    currentIndex,
    layout,
    zoom,
    panX,
    panY,
    isFullscreen,
    setImages,
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
  };
}
