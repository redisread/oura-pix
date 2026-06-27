/**
 * GenerationCard Component
 *
 * Card display for a single generation record
 */

import { useState } from "react";
import * as m from "@/paraglide/messages.js";
import type { GenerationRecord } from "@/hooks/useGenerations";

interface GenerationCardProps {
  generation: GenerationRecord;
  onViewDetail: (id: string) => void;
  onRegenerate: (id: string) => void;
  onEdit: (imageUrl: string) => void;
  onDelete: (id: string) => void;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return m.common_justNow();
  if (diffMins < 60) return m.common_minutesAgo({ count: diffMins.toString() });
  if (diffHours < 24) return m.common_hoursAgo({ count: diffHours.toString() });
  if (diffDays < 7) return m.common_daysAgo({ count: diffDays.toString() });
  return date.toLocaleDateString("zh-CN");
}

function getStatusInfo(status: string): { label: string; color: string; bg: string } {
  switch (status) {
    case "success":
    case "completed":
      return { label: m.profile_history_status_completed(), color: "text-green-700", bg: "bg-green-100" };
    case "processing":
    case "pending":
      return { label: m.profile_history_status_processing(), color: "text-yellow-700", bg: "bg-yellow-100" };
    case "failed":
    case "error":
      return { label: m.profile_history_status_failed(), color: "text-red-700", bg: "bg-red-100" };
    default:
      return { label: status, color: "text-gray-700", bg: "bg-gray-100" };
  }
}

function getPlatformIcon(platform: string): string {
  switch (platform) {
    case "amazon":
      return "🅰️";
    case "shopify":
      return "🛍️";
    case "ebay":
      return "🏷️";
    case "etsy":
      return "🎨";
    default:
      return "📦";
  }
}

export default function GenerationCard({
  generation,
  onViewDetail,
  onRegenerate,
  onEdit,
  onDelete,
}: GenerationCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const statusInfo = getStatusInfo(generation.status);
  const platformIcon = getPlatformIcon(generation.platform);
  const thumbnail = generation.productImageUrl || generation.generatedImages[0] || null;

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(generation.id);
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div
      className="group relative bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-stone-200 dark:border-stone-700"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowDeleteConfirm(false);
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-stone-100 dark:bg-stone-900 overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={m.generation_productImageAlt()}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Status Badge */}
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
          {statusInfo.label}
        </div>

        {/* Image Count Badge */}
        {generation.generatedImages.length > 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium bg-black/60 text-white">
            {m.generation_imageCount({ count: generation.generatedImages.length.toString() })}
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity duration-200 ${
            showActions ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => onViewDetail(generation.id)}
            className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
            title={m.profile_history_viewDetail()}
          >
            <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => onRegenerate(generation.id)}
            className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
            title={m.history_regenerate()}
          >
            <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => {
              const imageUrl = generation.generatedImages[0] || generation.productImageUrl;
              if (imageUrl) onEdit(imageUrl);
            }}
            className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
            title={m.editor_editImage()}
          >
            <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            className={`p-2 rounded-full transition-colors ${
              showDeleteConfirm
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-white/90 hover:bg-white text-stone-700"
            }`}
            title={showDeleteConfirm ? m.history_deleteConfirm() : m.common_delete()}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title / Prompt */}
        <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100 line-clamp-2 mb-2">
          {generation.prompt || m.generation_taskTitle({ id: generation.id.slice(0, 8) })}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1">
            <span>{platformIcon}</span>
            <span className="capitalize">{generation.platform}</span>
          </div>
          <div>{formatTime(generation.createdAt)}</div>
        </div>

        {/* Style Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="px-1.5 py-0.5 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded">
            {generation.style}
          </span>
          <span className="px-1.5 py-0.5 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded">
            {generation.language}
          </span>
          {generation.count > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded">
              ×{generation.count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
