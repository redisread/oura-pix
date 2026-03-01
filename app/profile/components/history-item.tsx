"use client";

import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GenerationRecord } from "../types";

interface HistoryItemProps {
  record: GenerationRecord;
  onViewDetail: (record: GenerationRecord) => void;
  onDelete: (id: string) => void;
}

// 图片缩略图组件
function ImageThumbnail({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative aspect-square w-16 bg-slate-100 rounded-lg overflow-hidden ${
        onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      }`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <span className="absolute bottom-1 right-1 text-[10px] text-slate-400 truncate max-w-full px-1">
        {alt}
      </span>
    </div>
  );
}

export function HistoryItem({ record, onViewDetail, onDelete }: HistoryItemProps) {
  const t = useTranslations("profile");

  const statusVariant = {
    completed: "success" as const,
    processing: "warning" as const,
    failed: "error" as const,
    pending: "secondary" as const,
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 line-clamp-2">
            {record.prompt || "No prompt"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{formatDate(record.createdAt)}</span>
            <Badge variant="outline" className="text-xs">
              {record.platform}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {record.style}
            </Badge>
            <Badge variant={statusVariant[record.status]} className="text-xs">
              {record.status}
            </Badge>
          </div>

          {/* 上传的图片 */}
          {record.referenceImageUrls.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">{t("history.uploadedImages")}</p>
              <div className="flex gap-2 flex-wrap">
                {record.referenceImageUrls.slice(0, 4).map((img, idx) => (
                  <ImageThumbnail
                    key={idx}
                    src={img}
                    alt={`Upload ${idx + 1}`}
                    onClick={() => onViewDetail(record)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 生成的图片 */}
          {record.generatedImages.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">{t("history.generatedImages")}</p>
              <div className="flex gap-2 flex-wrap">
                {record.generatedImages.slice(0, 4).map((img, idx) => (
                  <ImageThumbnail
                    key={idx}
                    src={img}
                    alt={`Result ${idx + 1}`}
                    onClick={() => onViewDetail(record)}
                  />
                ))}
                {record.generatedImages.length > 4 && (
                  <div
                    onClick={() => onViewDetail(record)}
                    className="aspect-square w-16 bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    <span className="text-sm text-slate-600">
                      +{record.generatedImages.length - 4}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetail(record)}
          >
            {t("history.viewDetails")}
          </Button>
          <Button variant="default" size="sm">
            {t("history.regenerate")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(record.id)}
          >
            {t("history.delete")}
          </Button>
        </div>
      </div>
    </div>
  );
}