import { describe, expect, it } from "vitest";

import app from "./index";

describe("API smoke routes", () => {
  it("returns a JSON health response", async () => {
    const response = await app.request("/health");
    const body = await response.json() as { status?: string; timestamp?: string };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(Number.isNaN(Date.parse(body.timestamp ?? ""))).toBe(false);
  });

  it("localizes API test route messages", async () => {
    const zhResponse = await app.request("/api/test", {
      headers: { "X-Oura-Locale": "zh-CN" },
    });
    const enResponse = await app.request("/api/test", {
      headers: { "X-Oura-Locale": "en" },
    });
    const zhBody = await zhResponse.json() as { message?: string };
    const enBody = await enResponse.json() as { message?: string };

    expect(zhBody.message).toBe("测试路由正常");
    expect(enBody.message).toBe("Test route works");
  });

  it("returns the standard JSON envelope for unknown routes", async () => {
    const response = await app.request("/missing-route");
    const body = await response.json() as {
      success?: boolean;
      error?: { code?: string; message?: string };
      meta?: { requestId?: string };
    };

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error?.code).toBe("NOT_FOUND");
    expect(body.meta?.requestId).toBeDefined();
  });
});
