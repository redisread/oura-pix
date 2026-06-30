/**
 * Input Component
 *
 * Unified input component with label, error message, and icon support.
 * Replaces standalone .input CSS class usage.
 */

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

const INPUT_CLASSES =
  "w-full rounded-[var(--radius)] border border-[hsl(var(--border))] bg-[hsl(var(--input))] " +
  "px-3 py-2.5 text-sm leading-5 text-[hsl(var(--foreground))] " +
  "placeholder:text-[hsl(var(--foreground-muted))] " +
  "transition-[border-color,box-shadow] duration-180 ease-out " +
  "focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-[3px] focus:ring-[hsl(var(--primary)/0.24)] " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, iconPosition = "left", id, className = "", ...props },
  ref
) {
  const inputId = id ?? props.name ?? `input-${Math.random().toString(36).slice(2, 10)}`;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-[hsl(var(--foreground))]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === "left" && (
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-muted))]"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`${INPUT_CLASSES} ${icon && iconPosition === "left" ? "pl-9" : ""} ${icon && iconPosition === "right" ? "pr-9" : ""} ${error ? "border-[hsl(var(--color-error))]" : ""}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {icon && iconPosition === "right" && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--foreground-muted))]"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 flex items-center gap-1 text-xs text-[hsl(var(--color-error))]" role="alert">
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[hsl(var(--foreground-muted))]">
          {hint}
        </p>
      )}
    </div>
  );
});

export default Input;
