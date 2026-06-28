/**
 * StateMessage Component
 *
 * Unified tri-state handling for data-loading components:
 * - loading: spinner + optional message
 * - error: red alert box + optional retry button
 * - empty: centered icon + title + description + optional action button
 *
 * Replaces inline loading/error/empty implementations across all page components.
 */

import { Loader2, AlertCircle, Inbox } from "lucide-react";
import * as m from "@/paraglide/messages.js";

type StateMessageBase = {
  className?: string;
};

type LoadingState = StateMessageBase & {
  variant: "loading";
  message?: string;
};

type ErrorState = StateMessageBase & {
  variant: "error";
  message: string;
  onRetry?: () => void;
};

type EmptyState = StateMessageBase & {
  variant: "empty";
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export type StateMessageProps = LoadingState | ErrorState | EmptyState;

export function StateMessage(props: StateMessageProps) {
  switch (props.variant) {
    case "loading":
      return <LoadingMessage {...props} />;
    case "error":
      return <ErrorMessage {...props} />;
    case "empty":
      return <EmptyMessage {...props} />;
  }
}

function LoadingMessage({ message, className }: LoadingState) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 ${className ?? ""}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      {message && (
        <p className="mt-3 text-sm font-medium text-foreground-muted">
          {message}
        </p>
      )}
    </div>
  );
}

function ErrorMessage({ message, onRetry, className }: ErrorState) {
  return (
    <div className={`error-banner ${className ?? ""}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p>{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-semibold underline hover:no-underline"
            >
              {m.common_retry()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyMessage({
  title,
  description,
  icon,
  action,
  className,
}: EmptyState) {
  return (
    <div
      className={`panel-muted flex flex-col items-center justify-center px-4 py-16 ${className ?? ""}`}
    >
      <div className="mb-6 text-foreground-muted">
        {icon ?? <Inbox className="h-16 w-16" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-center text-sm text-foreground-muted">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary mt-6 h-10 px-6"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
