import { getCloudflareContext } from "@/lib/cloudflare-context";
import { createAuth } from "@/lib/auth";
import { NextRequest } from "next/server";
import { withDevInit } from "@/lib/with-dev-init";

export const runtime = "nodejs";

/**
 * 统一的认证处理函数
 */
async function handleAuth(request: NextRequest) {
  const { env } = await getCloudflareContext();
  const auth = createAuth(env.DB, env);
  return auth.handler(request);
}

/**
 * 处理 GET 认证请求
 * 包括获取会话、OAuth 回调等
 */
export const GET = withDevInit(handleAuth);

/**
 * 处理 POST 认证请求
 * 包括登录、注册、登出等
 */
export const POST = withDevInit(handleAuth);
