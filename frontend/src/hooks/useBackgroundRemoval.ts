/**
 * useBackgroundRemoval Hook
 *
 * Wraps @imgly/background-removal for use in React.
 * Heavy WASM work — runs in the browser, may take several seconds.
 */

import { useState, useCallback } from "react";
import { apiErr } from "@/lib/api";
import { removeBackground } from "@imgly/background-removal";
import * as m from "@/paraglide/messages.js";

export interface RemovalResult {
  // PNG blob (transparent background)
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

export function useBackgroundRemoval() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RemovalResult | null>(null);

  const remove = useCallback(async (imageUrl: string) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setResult(null);

    try {
      const blob = await removeBackground(imageUrl, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            setProgress(Math.round((current / total) * 100));
          }
        },
        output: { format: "image/png", quality: 0.92 },
      });

      const url = URL.createObjectURL(blob);

      // Get dimensions
      const img = new Image();
      img.src = url;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load result image"));
      });

      setResult({ blob, url, width: img.naturalWidth, height: img.naturalHeight });
      setProgress(100);
    } catch (err) {
      console.error("Background removal failed:", err);
      setError(apiErr(err, m.common_processingFailed()));
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setError(null);
    setProgress(0);
  }, [result]);

  return { loading, progress, error, result, remove, reset };
}
