/**
 * RatingInput Component
 *
 * Star rating input (1-5) for questionnaire rating-type questions.
 */

"use client";

import { useState } from "react";

interface RatingInputProps {
  label: string;
  value?: number;
  onChange: (value: number) => void;
  error?: string;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-6 h-6">
      <path
        d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.7L10 14.9l-5.2 2.6 1-5.7L1.5 7.7l5.9-.9L10 1.5z"
        fill={filled ? "#facc15" : "#e2e8f0"}
        stroke={filled ? "#facc15" : "#cbd5e1"}
        strokeWidth={0.5}
      />
    </svg>
  );
}

export function RatingInput({ label, value = 0, onChange, error }: RatingInputProps) {
  const [rating, setRating] = useState(value);

  const handleClick = (n: number) => {
    setRating(n);
    onChange(n);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground block">{label}</label>
      <div className="inline-flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => handleClick(n)}
            className="hover:scale-110 transition-transform"
            aria-label={`${n} 星`}
          >
            <StarIcon filled={n <= rating} />
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}