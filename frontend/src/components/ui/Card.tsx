/**
 * Card Component
 *
 * Unified card component with header, body, footer sections.
 * Supports hover effect and padding variants.
 */

import { forwardRef, type HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const PADDING_CLASSES: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const BASE_CLASSES =
  "rounded-[var(--radius-lg)] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm " +
  "transition-[border-color,box-shadow,transform] duration-180 ease-out";

const HOVER_CLASSES =
  "hover:border-[hsl(var(--primary)/0.5)] hover:shadow-md hover:-translate-y-0.5";

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { hover = false, padding = "none", children, className = "", ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`${BASE_CLASSES} ${hover ? HOVER_CLASSES : ""} ${PADDING_CLASSES[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual variant */
  variant?: "default" | "compact";
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ children, className = "", ...props }, ref) {
    return (
      <div ref={ref} className={`mb-4 ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  /** Enable scrollable overflow */
  scrollable?: boolean;
}

export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  function CardBody({ children, className = "", ...props }, ref) {
    return (
      <div ref={ref} className={`${className}`} {...props}>
        {children}
      </div>
    );
  }
);

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Horizontal alignment */
  align?: "left" | "center" | "right" | "between";
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ children, className = "", ...props }, ref) {
    return (
      <div
        ref={ref}
        className={`mt-4 flex items-center gap-2 border-t border-[hsl(var(--border))] pt-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export default Card;
