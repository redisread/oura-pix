/**
 * useQuestionnaire Hook
 *
 * Fetches questionnaire data and submits user responses via the v1 API.
 */

import { useState, useCallback } from "react";
import { apiErr, apiJson } from "@/lib/api";
import * as m from "@/paraglide/messages.js";

export type QuestionnaireType = "onboarding" | "pre_generation" | "feedback";

export interface Question {
  id: string;
  questionText: string;
  questionType: "single_choice" | "multiple_choice" | "text" | "rating";
  options: string[] | null;
  isRequired: boolean;
  sortOrder: number;
}

export interface Questionnaire {
  id: string;
  type: QuestionnaireType;
  title: string;
  description: string | null;
}

export interface QuestionnaireData {
  questionnaire: Questionnaire;
  questions: Question[];
}

export interface QuestionnaireResponse {
  id: string;
  questionnaireId: string;
  questionnaireTitle: string;
  questionnaireType: string;
  generationId: string | null;
  responses: Record<string, unknown>;
  completedAt: string;
}

export function useQuestionnaire() {
  const [data, setData] = useState<QuestionnaireData | null>(null);
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestionnaire = useCallback(async (type: QuestionnaireType) => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiJson<QuestionnaireData>(`/api/v1/questionnaires/${type}`));
    } catch (e) {
      setError(apiErr(e, m.common_loadFailed()));
    } finally {
      setLoading(false);
    }
  }, []);

  const submitResponse = useCallback(
    async (
      type: QuestionnaireType,
      answers: Record<string, unknown>,
      generationId?: string
    ) => {
      setSubmitting(true);
      setError(null);
      try {
        const body: Record<string, unknown> = { responses: answers };
        if (generationId) body.generationId = generationId;

        await apiJson<{ id: string }>(`/api/v1/questionnaires/${type}/responses`, {
          method: "POST",
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        });
        return true;
      } catch (e) {
        setError(apiErr(e, m.common_submitFailed()));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const fetchUserResponses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<QuestionnaireResponse[]>("/api/v1/questionnaires/responses");
      setResponses(data);
    } catch (e) {
      setError(apiErr(e, m.common_loadFailed()));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    responses,
    loading,
    submitting,
    error,
    fetchQuestionnaire,
    submitResponse,
    fetchUserResponses,
  };
}