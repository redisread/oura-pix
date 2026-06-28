/**
 * QuestionInput Component
 *
 * Renders the appropriate input control based on question type.
 * Supports: single_choice, multiple_choice, text, rating
 */

"use client";

import type { Question } from "@/hooks/useQuestionnaire";
import { ChoiceInput } from "./ChoiceInput";
import { RatingInput } from "./RatingInput";
import { TextInput } from "./TextInput";

interface QuestionInputProps {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

export function QuestionInput({ question, value, onChange, error }: QuestionInputProps) {
  const { questionType, options } = question;

  switch (questionType) {
    case "single_choice":
      return (
        <ChoiceInput
          label={question.questionText}
          options={options ?? []}
          value={value as string}
          onChange={onChange}
          multiple={false}
          error={error}
        />
      );

    case "multiple_choice":
      return (
        <ChoiceInput
          label={question.questionText}
          options={options ?? []}
          value={value as string[]}
          onChange={onChange}
          multiple={true}
          error={error}
        />
      );

    case "rating":
      return (
        <RatingInput
          label={question.questionText}
          value={value as number}
          onChange={onChange}
          error={error}
        />
      );

    case "text":
      return (
        <TextInput
          label={question.questionText}
          value={value as string}
          onChange={onChange}
          error={error}
        />
      );

    default:
      return null;
  }
}