/**
 * Metric Reporter
 *
 * Collects Web Vitals (LCP, INP, CLS, FCP, TTFB) and navigation timings,
 * then batches them to the backend. Batched + send-on-hidden to avoid
 * noisy network traffic during user interaction.
 */

import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals";

type Rating = "good" | "needs-improvement" | "poor";
type DeviceType = "mobile" | "tablet" | "desktop";

interface MetricPayload {
  name: string;
  value: number;
  rating?: Rating;
  url?: string;
  userAgent?: string;
  deviceType?: DeviceType;
  connectionType?: string;
  context?: Record<string, unknown>;
}

let installed = false;
const buffered: MetricPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5000;
const BATCH_SIZE = 20;
const MAX_BUFFER = 50;

function getDeviceType(): DeviceType {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getConnectionType(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  // navigator.connection is non-standard but supported in Chromium
  const conn = (navigator as unknown as { connection?: { effectiveType?: string } }).connection;
  return conn?.effectiveType;
}

function buildContext(): Omit<MetricPayload, "name" | "value"> {
  return {
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    deviceType: getDeviceType(),
    connectionType: getConnectionType(),
  };
}

async function send(payload: MetricPayload): Promise<void> {
  try {
    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    /* never let the reporter itself block the app */
  }
}

async function flushBatch(): Promise<void> {
  if (buffered.length === 0) return;
  const batch = buffered.splice(0, BATCH_SIZE);
  try {
    await fetch("/api/metrics/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ metrics: batch }),
      keepalive: true,
    });
  } catch {
    /* swallow; metrics are best-effort */
  }
}

function enqueue(metric: MetricPayload): void {
  if (buffered.length >= MAX_BUFFER) {
    // Drop oldest to prevent unbounded growth if backend is down
    buffered.shift();
  }
  buffered.push(metric);

  if (buffered.length >= BATCH_SIZE) {
    void flushBatch();
  } else if (flushTimer === null) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      void flushBatch();
    }, FLUSH_INTERVAL_MS);
  }
}

function setupVisibilityFlush(): void {
  if (typeof document === "undefined") return;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void flushBatch();
    }
  });
  // Also flush on pagehide for browsers that don't fire visibilitychange
  window.addEventListener("pagehide", () => {
    void flushBatch();
  });
}

/**
 * Install Web Vitals collection. Idempotent.
 */
export function installMetricReporter(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  setupVisibilityFlush();

  const ctx = buildContext();
  const baseContext: Record<string, unknown> = { ...ctx };

  onLCP((m) => enqueue({ ...baseContext, name: "LCP", value: m.value, rating: m.rating }));
  onINP((m) => enqueue({ ...baseContext, name: "INP", value: m.value, rating: m.rating }));
  onCLS((m) => enqueue({ ...baseContext, name: "CLS", value: m.value, rating: m.rating }));
  onFCP((m) => enqueue({ ...baseContext, name: "FCP", value: m.value, rating: m.rating }));
  onTTFB((m) => enqueue({ ...baseContext, name: "TTFB", value: m.value, rating: m.rating }));
}

/**
 * Manually report a metric (e.g. for a custom timing)
 */
export async function reportMetric(
  name: string,
  value: number,
  extra?: Partial<MetricPayload>
): Promise<void> {
  const ctx = buildContext();
  await send({ ...ctx, name, value, ...extra });
}
