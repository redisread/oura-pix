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
      <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-slate-500" />
      {message && (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {message}
        </p>
      )}
    </div>
  );
}

function ErrorMessage({ message, onRetry, className }: ErrorState) {
  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm font-medium text-red-600 underline hover:no-underline dark:text-red-400"
            >
              重试
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
      className={`flex flex-col items-center justify-center px-4 py-16 ${className ?? ""}`}
    >
      <div className="mb-6 text-slate-300 dark:text-slate-600">
        {icon ?? <Inbox className="h-16 w-16" />}
      </div>
      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-amber-700"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
