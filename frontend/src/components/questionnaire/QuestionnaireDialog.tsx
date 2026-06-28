/**
 * QuestionnaireDialog Component
 *
 * Modal overlay for displaying a questionnaire.
 * Used for both pre-generation preference surveys and post-generation feedback.
 */

"use client";

import { QuestionnaireForm } from "./QuestionnaireForm";
import type { QuestionnaireType } from "@/hooks/useQuestionnaire";

interface QuestionnaireDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: QuestionnaireType;
  title?: string;
  description?: string;
  generationId?: string;
  onComplete?: () => void;
}

export function QuestionnaireDialog({
  open,
  onOpenChange,
  type,
  title,
  description,
  generationId,
  onComplete,
}: QuestionnaireDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl shadow-lg max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-foreground-muted hover:text-foreground"
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
          <QuestionnaireForm
            type={type}
            title={title}
            description={description}
            generationId={generationId}
            onComplete={() => {
              onComplete?.();
              onOpenChange(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}