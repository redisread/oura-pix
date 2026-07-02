/**
 * QuestionnaireDialog Component
 *
 * Modal overlay for displaying a questionnaire.
 * Used for both pre-generation preference surveys and post-generation feedback.
 */

"use client";

import { Modal } from "@/components/ui";
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
  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      size="lg"
      overlay="dark-40"
      contentClassName="mx-4 max-h-[85vh] overflow-y-auto"
    >
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
    </Modal>
  );
}
