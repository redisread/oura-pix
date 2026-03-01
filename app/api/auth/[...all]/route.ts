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
    const { env } = await getCloudflareContext();
    const auth = createAuth(env.DB);
    return auth.handler(request);
  } catch (error) {
    console.error("Auth POST error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}