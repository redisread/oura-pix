/**
 * FavoriteCard Component
 *
 * Card display for a favorite image
 */

import { useState } from "react";
import { Check, Eye, HeartOff } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import type { Favorite } from "@/lib/api";
import { formatRelativeTime, getPlatformLabel } from "@/lib/format";

interface FavoriteCardProps {
  favorite: Favorite;
  isSelected: boolean;
  onSelect: (id: string) => void;
  selectionMode: boolean;
  onRemove: (id: string) => void;
  onView: (favorite: Favorite) => void;
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
      className={`group card relative aspect-square cursor-pointer overflow-hidden transition-all duration-200 ${
        isSelected
          ? "ring-4 ring-[hsl(var(--primary)/0.42)] ring-offset-2 ring-offset-[hsl(var(--background))]"
          : "hover:shadow-lg"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={m.profile_history_viewDetail()}
    >
      <img
        src={favorite.imageUrl}
        alt={m.favorite_imageAlt()}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />

      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
              isSelected
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]"
                : "border-[hsl(var(--card))] bg-[hsl(var(--card)/0.86)]"
            }`}
          >
            {isSelected && (
              <Check className="h-4 w-4 text-white" aria-hidden="true" />
            )}
          </div>
        </div>
      )}

      <div
        className={`absolute inset-0 flex items-center justify-center gap-2 bg-[hsl(var(--foreground)/0.42)] transition-opacity duration-200 ${
          showActions && !selectionMode ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(favorite);
          }}
          className="icon-button h-10 w-10 bg-[hsl(var(--card)/0.92)] text-foreground hover:bg-[hsl(var(--card))]"
          title={m.profile_history_viewDetail()}
          aria-label={m.profile_history_viewDetail()}
        >
          <Eye className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(favorite.id);
          }}
          className="icon-button h-10 w-10 bg-[hsl(var(--card)/0.92)] text-[hsl(var(--color-error))] hover:bg-[hsl(var(--card))]"
          title={m.favorite_remove()}
          aria-label={m.favorite_remove()}
        >
          <HeartOff className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-[hsl(var(--foreground)/0.72)] p-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[hsl(var(--background))]">
          <span>{getPlatformLabel(favorite.generation?.settings?.targetPlatform)}</span>
          <span>{formatRelativeTime(favorite.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
