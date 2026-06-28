/**
 * Error Reporter
 *
 * Captures unhandled errors and promise rejections, then reports them
 * to the backend. Idempotent installation: only one global handler at a time.
 */

type ErrorContext = Record<string, unknown>;

import { apiFetch } from "./api";
import * as m from "@/paraglide/messages.js";

interface ReportErrorPayload {
  message: string;
  stack?: string;
  severity?: "critical" | "high" | "medium" | "low";
  type?: "network" | "validation" | "authentication" | "business_logic" | "runtime" | "unknown";
  module?: "api" | "frontend" | "worker" | "database";
  context?: ErrorContext;
}

let installed = false;
let lastReportAt = 0;
const REPORT_THROTTLE_MS = 2000;

function inferSeverity(message: string): ReportErrorPayload["severity"] {
  const lower = message.toLowerCase();
  if (lower.includes("script error") || lower.includes("chunk")) return "high";
  if (lower.includes("network") || lower.includes("fetch")) return "medium";
  return "medium";
}

function inferType(message: string, stack?: string): ReportErrorPayload["type"] {
  const m = (message + " " + (stack ?? "")).toLowerCase();
  if (m.includes("network") || m.includes("fetch")) return "network";
  if (m.includes("unauthorized") || m.includes("auth")) return "authentication";
  if (m.includes("validation") || m.includes("invalid")) return "validation";
  if (m.includes("typeerror") || m.includes("referenceerror")) return "runtime";
  return "unknown";
}

async function send(payload: ReportErrorPayload): Promise<void> {
  // Throttle: skip if we just reported within the throttle window
  const now = Date.now();
  if (now - lastReportAt < REPORT_THROTTLE_MS) return;
  lastReportAt = now;

  try {
    await apiFetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
      // Use keepalive so the request survives a page unload triggered by the error
      keepalive: true,
    });
  } catch {
    // Silently swallow reporting errors — we never want the reporter itself to throw
  }
}

function toErrorPayload(error: unknown, context: ErrorContext = {}): ReportErrorPayload {
  if (error instanceof Error) {
    return {
      message: error.message || error.name || m.common_unknownError(),
      stack: error.stack,
      severity: inferSeverity(error.message),
      type: inferType(error.message, error.stack),
      module: "frontend",
      context: {
        ...context,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      },
    };
  }
  return {
    message: typeof error === "string" ? error : m.common_unknownError(),
    severity: "medium",
    type: "unknown",
    module: "frontend",
    context,
  };
}

/**
 * Install global error handlers. Idempotent — safe to call multiple times.
 */
export function installErrorReporter(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event) => {
    const error = event.error ?? event;
    send(toErrorPayload(error));
  });

  window.addEventListener("unhandledrejection", (event) => {
    send(toErrorPayload(event.reason));
  });
}

/**
 * Manually report an error. Useful inside try/catch where you want to
 * surface a caught error to the dashboard.
 */
export async function reportError(error: unknown, context?: ErrorContext): Promise<void> {
  await send(toErrorPayload(error, context));
}
