/**
 * FavoriteButton Component
 *
 * Toggle button for adding/removing favorites
 */

import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { useFavorites } from "@/hooks/useFavorites";

interface FavoriteButtonProps {
  generationId: string;
  imageUrl: string;
  imageIndex?: number;
  className?: string;
}

export default function FavoriteButton({
  generationId,
  imageUrl,
  imageIndex,
  className = "",
}: FavoriteButtonProps) {
  const { addFavorite, removeFavorite, checkFavorite } = useFavorites();
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const result = await checkFavorite(imageUrl);
      if (!cancelled) {
        setIsFavorited(result.isFavorited);
        setFavoriteId(result.favoriteId);
        setIsLoading(false);
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [imageUrl, checkFavorite]);

  const toggleFavorite = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);

    if (isFavorited && favoriteId) {
      const success = await removeFavorite(favoriteId);
      if (success) {
        setIsFavorited(false);
        setFavoriteId(null);
      }
    } else {
      const id = await addFavorite(generationId, imageUrl, imageIndex);
      if (id) {
        setIsFavorited(true);
        setFavoriteId(id);
      }
    }

    setIsToggling(false);
  }, [isFavorited, favoriteId, generationId, imageUrl, imageIndex, addFavorite, removeFavorite, isToggling]);

  if (isLoading) {
    return (
      <div className={`h-8 w-8 animate-pulse rounded-full bg-[hsl(var(--card)/0.8)] ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isToggling}
      className={`p-1.5 rounded-full transition-all duration-200 ${
        isFavorited
          ? "text-[hsl(var(--color-error))] hover:text-[hsl(var(--color-error))]"
          : "text-white/80 hover:text-white"
      } ${isToggling ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      title={isFavorited ? m.favorite_remove() : m.favorite_add()}
      aria-label={isFavorited ? m.favorite_remove() : m.favorite_add()}
    >
      <Heart
        className={`h-5 w-5 transition-transform ${isToggling ? "scale-90" : "scale-100"}`}
        fill={isFavorited ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  );
}
