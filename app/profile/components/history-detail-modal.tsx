"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GenerationRecord } from "../types";

// 图片缩略图组件
function ImageThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
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

interface HistoryDetailModalProps {
  record: GenerationRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryDetailModal({ record, isOpen, onClose }: HistoryDetailModalProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  if (!record) return null;

  const statusVariant = {
    completed: "success" as const,
    processing: "warning" as const,
    failed: "error" as const,
    pending: "secondary" as const,
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("history.detailModal.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">{t("history.detailModal.createdAt")}</p>
              <p className="text-base font-medium text-slate-900">
                {formatDate(record.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("history.detailModal.status")}</p>
              <Badge variant={statusVariant[record.status]}>{record.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("history.platform")}</p>
              <p className="text-base font-medium text-slate-900 capitalize">{record.platform}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("history.style")}</p>
              <p className="text-base font-medium text-slate-900 capitalize">{record.style}</p>
            </div>
          </div>

          {/* 提示词 */}
          {record.prompt && (
            <div>
              <p className="text-sm text-slate-500 mb-2">{t("history.detailModal.promptUsed")}</p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-700">{record.prompt}</p>
              </div>
            </div>
          )}

          {/* 原始图片 */}
          {record.referenceImageUrls.length > 0 && (
            <div>
              <p className="text-sm text-slate-500 mb-3">
                {t("history.detailModal.originalImages")} ({record.referenceImageUrls.length})
              </p>
              <div className="grid grid-cols-4 gap-3">
                {record.referenceImageUrls.map((img, idx) => (
                  <ImageThumbnail key={idx} src={img} alt={`Original ${idx + 1}`} />
                ))}
              </div>
            </div>
          )}

          {/* 生成结果 */}
          {record.generatedImages.length > 0 && (
            <div>
              <p className="text-sm text-slate-500 mb-3">
                {t("history.detailModal.generatedResults")} ({record.generatedImages.length})
              </p>
              <div className="grid grid-cols-4 gap-3">
                {record.generatedImages.map((img, idx) => (
                  <ImageThumbnail key={idx} src={img} alt={`Result ${idx + 1}`} />
                ))}
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {record.errorMessage && (
            <div>
              <p className="text-sm text-slate-500 mb-2">{t("history.detailModal.error")}</p>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-700">{record.errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tCommon("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}