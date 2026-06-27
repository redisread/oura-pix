/**
 * FavoriteCard Component
 *
 * Card display for a favorite image
 */

import { useState } from "react";
import type { Favorite } from "@/hooks/useFavorites";

interface FavoriteCardProps {
  favorite: Favorite;
  isSelected: boolean;
  onSelect: (id: string) => void;
  selectionMode: boolean;
  onRemove: (id: string) => void;
  onView: (favorite: Favorite) => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 1) return "今天";
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString("zh-CN");
}

function getPlatformLabel(platform?: string): string {
  switch (platform) {
    case "amazon":
      return "Amazon";
    case "shopify":
      return "Shopify";
    case "ebay":
      return "eBay";
    case "etsy":
      return "Etsy";
    default:
      return "通用";
  }
}

export default function FavoriteCard({
  favorite,
  isSelected,
  onSelect,
  selectionMode,
  onRemove,
  onView,
}: FavoriteCardProps) {
  const [showActions, setShowActions] = useState(false);

  const handleClick = () => {
    if (selectionMode) {
      onSelect(favorite.id);
    } else {
      onView(favorite);
    }
  };

  return (
    <div
      className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected
          ? "ring-4 ring-amber-500 ring-offset-2 dark:ring-offset-stone-900"
          : "hover:shadow-lg"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleClick}
    >
      {/* Image */}
      <img
        src={favorite.imageUrl}
        alt="收藏图片"
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />

      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? "bg-amber-500 border-amber-500"
                : "bg-white/80 border-white/80"
            }`}
          >
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Hover Overlay */}
      <div
        className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity duration-200 ${
          showActions && !selectionMode ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(favorite);
          }}
          className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
          title="查看详情"
        >
          <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(favorite.id);
          }}
          className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
          title="取消收藏"
        >
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between text-xs text-white">
          <span>{getPlatformLabel(favorite.generation?.settings?.targetPlatform)}</span>
          <span>{formatTime(favorite.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
