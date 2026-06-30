/**
 * Badge Component
 *
 * Unified badge/tag component. Replaces .status-badge CSS class.
 * Supports multiple variants with semantic colors.
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

export type BadgeVariant =
  | "primary"
  | "secondary"
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "error";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: ReactNode;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  primary:
    "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
  secondary:
    "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border border-[hsl(var(--border))]",
  neutral:
    "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
  info:
    "bg-[hsl(var(--color-info-light))] text-[hsl(var(--color-info))]",
  success:
    "bg-[hsl(var(--color-success-light))] text-[hsl(var(--color-success))]",
  warning:
    "bg-[hsl(var(--color-warning-light))] text-[hsl(var(--color-warning))]",
  error:
    "bg-[hsl(var(--color-error-light))] text-[hsl(var(--color-error))]",
};

const BASE_CLASSES =
  "inline-flex items-center gap-1 rounded-[var(--radius-full)] " +
  "px-2.5 py-0.5 text-xs font-medium leading-4 whitespace-nowrap";

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant = "neutral", icon, children, className = "", ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="h-3 w-3 shrink-0" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
});

export default Badge;
