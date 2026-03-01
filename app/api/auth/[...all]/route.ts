import { getCloudflareContext } from "@/lib/cloudflare-context";
import { createAuth } from "@/lib/auth";
import { NextRequest } from "next/server";

// 使用 Node.js runtime，因为 wrangler 的 getPlatformProxy 需要 Node.js 环境
// 生产环境部署到 Cloudflare Workers 时，OpenNext 会处理 Edge Runtime 的转换
export const runtime = "nodejs";

/**
 * 处理 GET 认证请求
 * 包括获取会话、OAuth 回调等
 */
export async function GET(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const auth = createAuth(env.DB);
    return auth.handler(request);
  } catch (error) {
    console.error("Auth GET error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * 处理 POST 认证请求
 * 包括登录、注册、登出等
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[Auth POST] Starting request handling...");
    const { env } = await getCloudflareContext();
    console.log("[Auth POST] Got Cloudflare context, DB:", !!env.DB);
    const auth = createAuth(env.DB);
    console.log("[Auth POST] Auth instance created");

    const response = await auth.handler(request);
    console.log("[Auth POST] Response status:", response.status);

    // Log response body for debugging
    const responseClone = response.clone();
    const body = await responseClone.text();
    console.log("[Auth POST] Response body:", body);

    return response;
  } catch (error) {
    console.error("Auth POST error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}