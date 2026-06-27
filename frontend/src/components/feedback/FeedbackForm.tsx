/**
 * FeedbackForm Component
 *
 * Star rating + optional comment for a generation
 */

"use client";

import { useState } from "react";
import { useFeedback } from "@/hooks/useFeedback";

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
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          <StarIcon filled={n <= value} />
        </button>
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("zh-CN", {
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
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="panel-title">用户反馈</h3>
        {stats && stats.count > 0 && (
          <div className="flex items-center gap-2 text-sm text-foreground-muted">
            <span>{stats.count} 条评价</span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-[hsl(var(--accent))]">★</span>
              <span className="font-medium text-foreground">
                {stats.avgRating?.toFixed(1) ?? "-"}
              </span>
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner mb-3 p-2">
          <p className="text-xs">{error}</p>
        </div>
      )}

      {showThanks ? (
        <p className="success-banner py-2 text-center text-sm">感谢您的反馈！</p>
      ) : showForm ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="panel-label mb-1 block">评分</label>
            <RatingStars value={rating} onChange={setRating} />
          </div>
          <div className="mb-3">
            <label className="panel-label mb-1 block">评论（可选）</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={2000}
              className="input"
              placeholder="说说你的感受..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn-secondary h-9 px-3"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={rating === 0 || submitting}
              className="btn-primary h-9 px-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "提交中..." : "提交"}
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="text-sm font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]"
        >
          提交反馈
        </button>
      )}

      {loading && list.length === 0 ? (
        <p className="mt-3 text-xs text-foreground-muted">加载反馈...</p>
      ) : list.length > 0 ? (
        <div className="mt-4 space-y-2">
          {list.slice(0, 5).map((f) => (
            <div key={f.id} className="border-t border-[hsl(var(--border))] pt-2">
              <div className="flex items-center gap-2 mb-1">
                <RatingStars value={f.rating} readonly />
                <span className="font-utility text-xs text-foreground-muted">{formatDate(f.createdAt)}</span>
              </div>
              {f.comment && <p className="text-sm text-foreground-muted">{f.comment}</p>}
            </div>
          ))}
          {list.length > 5 && (
            <p className="text-center text-xs text-foreground-muted">还有 {list.length - 5} 条反馈...</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
