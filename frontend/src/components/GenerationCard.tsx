/**
 * GenerationCard Component
 *
 * Card display for a single generation record
 */

import { useState } from "react";
import { Eye, ImageIcon, Pencil, RotateCw, Trash2 } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import type { GenerationRecord } from "@/hooks/useGenerations";
import { formatLocaleDate } from "@/lib/locale";

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
  return formatLocaleDate(date);
}

function getStatusInfo(status: string): { label: string; badge: string; progress: number; progressText: string } {
  switch (status) {
    case "success":
    case "completed":
      return {
        label: m.profile_history_status_completed(),
        badge: "status-badge-success",
        progress: 100,
        progressText: m.generation_stage_completed(),
      };
    case "processing":
      return {
        label: m.profile_history_status_processing(),
        badge: "status-badge-warning",
        progress: 70,
        progressText: "生成中...",
      };
    case "pending":
      return {
        label: m.profile_history_status_processing(),
        badge: "status-badge-warning",
        progress: 10,
        progressText: "排队中...",
      };
    case "failed":
    case "error":
      return {
        label: m.profile_history_status_failed(),
        badge: "status-badge-error",
        progress: 0,
        progressText: "生成失败",
      };
    default:
      return { label: status, badge: "status-badge-neutral", progress: 0, progressText: status };
  }
}

function getPlatformLabel(platform: string): string {
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
      return platform || m.common_custom();
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
  const platformLabel = getPlatformLabel(generation.platform);
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
      className="card card-hover group relative overflow-hidden"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowDeleteConfirm(false);
      }}
    >
      <div className="relative aspect-video overflow-hidden bg-[hsl(var(--secondary))]">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={m.generation_productImageAlt()}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-foreground-muted">
            <ImageIcon className="h-12 w-12" aria-hidden="true" />
          </div>
        )}

        <div className={`status-badge absolute left-2 top-2 ${statusInfo.badge}`}>
          {statusInfo.label}
        </div>

        {/* Progress Bar (P0 T2 #84) - shown for pending/processing */}
        {(generation.status === "pending" || generation.status === "processing") && (
          <div className="absolute bottom-0 left-0 right-0 bg-[hsl(var(--foreground)/0.78)] p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-[hsl(var(--background))]">
                {statusInfo.progressText}
              </span>
              <span className="text-xs font-semibold text-[hsl(var(--background))]">
                {statusInfo.progress}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[hsl(var(--background)/0.3)]">
              <div
                className="h-1 rounded-full bg-[hsl(var(--primary))] transition-all duration-500 ease-out"
                style={{ width: `${statusInfo.progress}%` }}
                role="progressbar"
                aria-valuenow={statusInfo.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>
        )}

        {generation.generatedImages.length > 0 && (
          <div className="status-badge absolute right-2 top-2 bg-[hsl(var(--foreground)/0.78)] text-[hsl(var(--background))]">
            {m.generation_imageCount({ count: generation.generatedImages.length.toString() })}
          </div>
        )}

        <div
          className={`absolute inset-0 flex items-center justify-center gap-2 bg-[hsl(var(--foreground)/0.42)] transition-opacity duration-200 ${
            showActions ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={() => onViewDetail(generation.id)}
            className="icon-button h-10 w-10 bg-[hsl(var(--card)/0.92)] text-foreground hover:bg-[hsl(var(--card))]"
            title={m.profile_history_viewDetail()}
            aria-label={m.profile_history_viewDetail()}
          >
            <Eye className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            onClick={() => onRegenerate(generation.id)}
            className="icon-button h-10 w-10 bg-[hsl(var(--card)/0.92)] text-foreground hover:bg-[hsl(var(--card))]"
            title={m.history_regenerate()}
            aria-label={m.history_regenerate()}
          >
            <RotateCw className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            onClick={() => {
              const imageUrl = generation.generatedImages[0] || generation.productImageUrl;
              if (imageUrl) onEdit(imageUrl);
            }}
            className="icon-button h-10 w-10 bg-[hsl(var(--card)/0.92)] text-foreground hover:bg-[hsl(var(--card))]"
            title={m.editor_editImage()}
            aria-label={m.editor_editImage()}
          >
            <Pencil className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            onClick={handleDelete}
            className={`icon-button h-10 w-10 ${
              showDeleteConfirm
                ? "bg-[hsl(var(--color-error))] text-white hover:bg-[hsl(var(--color-error))]"
                : "bg-[hsl(var(--card)/0.92)] text-foreground hover:bg-[hsl(var(--card))]"
            }`}
            title={showDeleteConfirm ? m.history_deleteConfirm() : m.common_delete()}
            aria-label={showDeleteConfirm ? m.history_deleteConfirm() : m.common_delete()}
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="p-3">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-foreground">
          {generation.prompt || m.generation_taskTitle({ id: generation.id.slice(0, 8) })}
        </h3>

        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <div className="font-utility capitalize">
            {platformLabel}
          </div>
          <div>{formatTime(generation.createdAt)}</div>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          <span className="status-badge status-badge-neutral">
            {generation.style}
          </span>
          <span className="status-badge status-badge-neutral">
            {generation.language}
          </span>
          {generation.count > 0 && (
            <span className="status-badge status-badge-neutral">
              ×{generation.count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
