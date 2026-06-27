/**
 * FavoriteButton Component
 *
 * Toggle button for adding/removing favorites
 */

import { useState, useEffect, useCallback } from "react";
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
      <div className={`w-8 h-8 rounded-full bg-white/80 animate-pulse ${className}`} />
    );
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={isToggling}
      className={`p-1.5 rounded-full transition-all duration-200 ${
        isFavorited
          ? "text-red-500 hover:text-red-600"
          : "text-white/80 hover:text-white"
      } ${isToggling ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      title={isFavorited ? m.favorite_remove() : m.favorite_add()}
    >
      <svg
        className={`w-5 h-5 transition-transform ${isToggling ? "scale-90" : "scale-100"}`}
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
