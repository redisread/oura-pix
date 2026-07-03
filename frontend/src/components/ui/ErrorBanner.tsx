import * as m from "@/paraglide/messages.js";

interface ErrorBannerProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ message, title, onRetry, className }: ErrorBannerProps) {
  return (
    <div className={`error-banner ${className ?? ""}`} role="alert">
      {title && <p className="font-semibold">{title}</p>}
      <p className={title ? "mt-1 text-sm" : undefined}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-sm font-semibold underline hover:no-underline"
        >
          {m.common_retry()}
        </button>
      )}
    </div>
  );
}
