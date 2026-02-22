import { getRequestContext } from "@cloudflare/next-on-pages";
import { createAuth } from "@/lib/auth";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * 获取 D1 数据库实例
 * 在 Cloudflare Pages 环境中通过 getRequestContext 获取
 */
function getDatabase() {
  const { env } = getRequestContext();
  return env.DB;
}

/**
 * 处理 GET 认证请求
 * 包括获取会话、OAuth 回调等
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const auth = createAuth(db);
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
    const db = getDatabase();
    const auth = createAuth(db);
    return auth.handler(request);
  } catch (error) {
    console.error("Auth POST error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
