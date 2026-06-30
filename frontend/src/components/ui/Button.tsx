/**
 * Button Component
 *
 * Unified button component that replaces .btn-primary, .btn-secondary, .btn-ghost CSS classes.
 * Supports variants, sizes, loading state, and icon placement.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-md hover:bg-[hsl(var(--primary-hover))] active:translate-y-0 hover:-translate-y-0.5",
  secondary:
    "border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]",
  ghost:
    "text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground)/0.06)]",
  danger:
    "bg-[hsl(var(--color-error))] text-white hover:bg-[hsl(var(--color-error)/0.9)]",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
  icon: "h-10 w-10 gap-0",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-[var(--radius)] font-[650] leading-5 no-underline " +
  "transition-[background-color,border-color,color,transform,box-shadow] duration-180 ease-out " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--background))]";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    icon,
    iconPosition = "left",
    fullWidth = false,
    children,
    className = "",
    disabled,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {!loading && icon && iconPosition === "left" && <span aria-hidden="true">{icon}</span>}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === "right" && <span aria-hidden="true">{icon}</span>}
    </button>
  );
});

export default Button;
