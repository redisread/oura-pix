/**
 * CompareGrid Component
 *
 * Displays images in various grid layouts
 */

import type { CompareImage, LayoutMode } from "@/hooks/useCompare";

interface CompareGridProps {
  images: CompareImage[];
  layout: LayoutMode;
  zoom: number;
  panX: number;
  panY: number;
  onWheel: (e: React.WheelEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  currentIndex: number;
  onSelectImage?: (index: number) => void;
}

function getGridLayout(layout: LayoutMode, _imageCount: number): string {
  switch (layout) {
    case "grid-2x2":
      return "grid-cols-2 grid-rows-2";
    case "grid-1x4":
      return "grid-cols-4 grid-rows-1";
    case "grid-4x1":
      return "grid-cols-1 grid-rows-4";
    case "single":
      return "grid-cols-1 grid-rows-1";
    default:
      return "grid-cols-2 grid-rows-2";
  }
}

export default function CompareGrid({
  images,
  layout,
  zoom,
  panX,
  panY,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  currentIndex,
  onSelectImage,
}: CompareGridProps) {
  const displayImages = layout === "single" ? [images[currentIndex]] : images.slice(0, 4);
  const gridClass = getGridLayout(layout, displayImages.length);

  return (
    <div
      className={`grid ${gridClass} gap-2 w-full h-full bg-stone-900 rounded-lg overflow-hidden`}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {displayImages.map((img, idx) => (
        <div
          key={img.id}
          className={`relative overflow-hidden cursor-grab active:cursor-grabbing ${
            layout === "single" ? "col-span-1 row-span-1" : ""
          } ${
            layout !== "single" && onSelectImage && idx === currentIndex
              ? "ring-2 ring-amber-500"
              : ""
          }`}
          onClick={() => onSelectImage?.(idx)}
        >
          <img
            src={img.url}
            alt={img.title || `图片 ${idx + 1}`}
            className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
            style={{
              transform: `scale(${zoom}) translate(${panX}px, ${panY}px)`,
              transformOrigin: "center",
            }}
            draggable={false}
          />
          {/* Image Index Badge */}
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-xs rounded">
            {idx + 1}
          </div>
        </div>
      ))}
    </div>
  );
}
