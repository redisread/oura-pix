/**
 * QuestionnaireForm Component
 *
 * Main container that renders a full questionnaire.
 * Handles form state, validation, and submission.
 */

"use client";

import * as m from "@/paraglide/messages.js";
import { useState, useEffect, useCallback } from "react";
import { useQuestionnaire, type QuestionnaireType } from "@/hooks/useQuestionnaire";
import { QuestionInput } from "./QuestionInput";

interface QuestionnaireFormProps {
  type: QuestionnaireType;
  title?: string;
  description?: string;
  generationId?: string;
  onComplete?: () => void;
}

export function QuestionnaireForm({
  type,
  title,
  description,
  generationId,
  onComplete,
}: QuestionnaireFormProps) {
  const {
    data,
    loading,
    submitting,
    error: hookError,
    fetchQuestionnaire,
    submitResponse,
  } = useQuestionnaire();

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Fetch questionnaire on mount
  useEffect(() => {
    fetchQuestionnaire(type);
  }, [type, fetchQuestionnaire]);

  // Reset answers when data changes
  useEffect(() => {
    if (data?.questions) {
      const initial: Record<string, unknown> = {};
      data.questions.forEach((q) => {
        if (q.questionType === "multiple_choice") {
          initial[q.id] = [];
        } else if (q.questionType === "rating") {
          initial[q.id] = 0;
        } else {
          initial[q.id] = "";
        }
      });
      setAnswers(initial);
    }
  }, [data]);

  const handleAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    if (!data) return false;
    const newErrors: Record<string, string> = {};
    let valid = true;

    data.questions.forEach((q) => {
      if (!q.isRequired) return;

      const value = answers[q.id];
      if (value === undefined || value === null || value === "" ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === "number" && value === 0 && q.questionType !== "rating")) {
        newErrors[q.id] = m.questionnaire_form_required();
        valid = false;
      }
    });

    setErrors(newErrors);
    return valid;
  }, [data, answers]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const success = await submitResponse(type, answers, generationId);
    if (success) {
      setSubmitted(true);
      onComplete?.();
    }
  }, [type, answers, generationId, submitResponse, validate, onComplete]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (hookError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{hookError}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (submitted) {
    return (
      <div className="text-center py-8 space-y-3">
        <div className="text-4xl">✓</div>
        <p className="text-lg font-medium text-foreground">{m.questionnaire_form_submittedTitle()}</p>
        <p className="text-sm text-foreground-muted">{m.questionnaire_form_submittedDesc()}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || data.questionnaire.title) && (
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">
            {title ?? data.questionnaire.title}
          </h3>
          {(description || data.questionnaire.description) && (
            <p className="text-sm text-foreground-muted">
              {description ?? data.questionnaire.description}
            </p>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-5">
        {data.questions.map((question) => (
          <div key={question.id} className="panel p-4 rounded-xl border border-border">
            <QuestionInput
              question={question}
              value={answers[question.id]}
              onChange={(value) => handleAnswer(question.id, value)}
              error={errors[question.id]}
            />
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? m.questionnaire_form_submitting() : m.questionnaire_form_submit()}
        </button>
      </div>
    </div>
  );
}
