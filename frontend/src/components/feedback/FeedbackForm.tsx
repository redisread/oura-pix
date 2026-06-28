/**
 * FeedbackForm Component
 *
 * Star rating + optional comment for a generation
 */

"use client";

import { useState } from "react";
import { useFeedback } from "@/hooks/useFeedback";
import { formatLocaleDateTime } from "@/lib/locale";
import * as m from "@/paraglide/messages.js";

interface FeedbackFormProps {
  generationId: string;
}

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5">
      <defs>
        <linearGradient id={`half-${filled}-${half}`}>
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="50%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      <path
        d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.7L10 14.9l-5.2 2.6 1-5.7L1.5 7.7l5.9-.9L10 1.5z"
        fill={half ? `url(#half-${filled}-${half})` : filled ? "#facc15" : "#e2e8f0"}
        stroke={filled ? "#facc15" : "#cbd5e1"}
        strokeWidth={0.5}
      />
    </svg>
  );
}

function RatingStars({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          onMouseEnter={(e) => {
            if (readonly) return;
            const buttons = e.currentTarget.parentElement?.querySelectorAll("button");
            buttons?.forEach((b, i) => {
              const star = b.querySelector("path");
              if (!star) return;
              star.setAttribute("fill", i < n ? "#facc15" : "#e2e8f0");
            });
          }}
          onMouseLeave={(e) => {
            if (readonly) return;
            const buttons = e.currentTarget.parentElement?.querySelectorAll("button");
            buttons?.forEach((b, i) => {
              const star = b.querySelector("path");
              if (!star) return;
              star.setAttribute("fill", i < value ? "#facc15" : "#e2e8f0");
            });
          }}
          className={readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"}
          aria-label={m.feedback_starLabel({ count: n.toString() })}
        >
          <StarIcon filled={n <= value} />
        </button>
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  return formatLocaleDateTime(dateString, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedbackForm({ generationId }: FeedbackFormProps) {
  const { list, stats, loading, error, submit } = useFeedback(generationId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showThanks, setShowThanks] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    const ok = await submit(rating, comment.trim() || undefined);
    setSubmitting(false);
    if (ok) {
      setRating(0);
      setComment("");
      setShowForm(false);
      setShowThanks(true);
      setTimeout(() => setShowThanks(false), 2500);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.feedback_title()}</h3>
        {stats && stats.count > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{m.feedback_reviewCount({ count: stats.count.toString() })}</span>
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {stats.avgRating?.toFixed(1) ?? "-"}
              </span>
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-2 rounded mb-3">
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {showThanks ? (
        <p className="text-sm text-green-600 dark:text-green-400 text-center py-2">{m.feedback_thanks()}</p>
      ) : showForm ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-xs text-slate-500 mb-1">{m.feedback_rating()}</label>
            <RatingStars value={rating} onChange={setRating} />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-slate-500 mb-1">{m.feedback_commentOptional()}</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
              placeholder={m.feedback_commentPlaceholder()}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded"
            >
              {m.common_cancel()}
            </button>
            <button
              type="submit"
              disabled={rating === 0 || submitting}
              className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? m.feedback_submitting() : m.feedback_submit()}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {m.feedback_submitLink()}
        </button>
      )}

      {loading && list.length === 0 ? (
        <p className="text-xs text-slate-400 mt-3">{m.feedback_loading()}</p>
      ) : list.length > 0 ? (
        <div className="mt-4 space-y-2">
          {list.slice(0, 5).map((f) => (
            <div key={f.id} className="border-t border-slate-100 dark:border-slate-800 pt-2">
              <div className="flex items-center gap-2 mb-1">
                <RatingStars value={f.rating} readonly />
                <span className="text-xs text-slate-400">{formatDate(f.createdAt)}</span>
              </div>
              {f.comment && <p className="text-sm text-slate-600 dark:text-slate-400">{f.comment}</p>}
            </div>
          ))}
          {list.length > 5 && (
            <p className="text-xs text-slate-400 text-center">
              {m.feedback_more({ count: (list.length - 5).toString() })}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
