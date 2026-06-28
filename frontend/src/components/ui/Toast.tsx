/**
 * Toast Notification System (P0 T3 #85)
 *
 * 轻量级 toast 通知，支持 success/error 类型，自动消失，可选 action 按钮。
 * 不引入第三方库，直接基于 React Context + Portal 实现。
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
}

interface ToastItem extends Required<Omit<ToastOptions, "action">> {
  id: number;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => number;
  success: (message: string, options?: Omit<ToastOptions, "variant">) => number;
  error: (message: string, options?: Omit<ToastOptions, "variant">) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

const VARIANT_STYLES: Record<ToastVariant, { bg: string; icon: ReactNode }> = {
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
  },
  error: {
    bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />,
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    icon: <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />,
  },
};

const VARIANT_TEXT: Record<ToastVariant, string> = {
  success: "text-emerald-800 dark:text-emerald-200",
  error: "text-red-800 dark:text-red-200",
  info: "text-blue-800 dark:text-blue-200",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message: string, options?: ToastOptions): number => {
      const id = ++idRef.current;
      const variant = options?.variant ?? "info";
      const duration = options?.duration ?? 4000;
      const item: ToastItem = {
        id,
        message,
        variant,
        duration,
        action: options?.action,
      };
      setToasts((prev) => [...prev, item]);
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const value: ToastContextValue = {
    show,
    success: (message, options) => show(message, { ...options, variant: "success" }),
    error: (message, options) => show(message, { ...options, variant: "error" }),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const styles = VARIANT_STYLES[toast.variant];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3 pr-2 rounded-lg border shadow-lg animate-in slide-in-from-top-2 ${styles.bg}`}
            role={toast.variant === "error" ? "alert" : "status"}
          >
            <div className="shrink-0 mt-0.5">{styles.icon}</div>
            <div className={`flex-1 text-sm font-medium ${VARIANT_TEXT[toast.variant]}`}>
              {toast.message}
            </div>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onClick();
                  onDismiss(toast.id);
                }}
                className={`shrink-0 text-sm font-semibold underline underline-offset-2 ${VARIANT_TEXT[toast.variant]}`}
              >
                {toast.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className={`shrink-0 opacity-60 hover:opacity-100 ${VARIANT_TEXT[toast.variant]}`}
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}