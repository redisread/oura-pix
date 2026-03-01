import { NextRequest, NextResponse } from "next/server";
import { getGenerationsList, getUserStats } from "@/lib/api/generations";
import { getCloudflareContext } from "@/lib/cloudflare-context";
import { createAuth } from "@/lib/auth";
import { cookies } from "next/headers";

// 使用 Node.js runtime，因为 wrangler 的 getPlatformProxy 需要 Node.js 环境
export const runtime = "nodejs";

/**
 * GET /api/generations
 * 获取生成历史列表
 *
 * Query params:
 * - page: 页码 (默认 1)
 * - pageSize: 每页数量 (默认 10)
 * - filter: 时间筛选 (all | today | week | month)
 * - stats: 是否只返回统计数据 (true/false)
 */
export async function GET(request: NextRequest) {
  try {
    // 获取当前用户
    const { env } = await getCloudflareContext();
    const auth = createAuth(env.DB);
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("ourapix.session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `ourapix.session=${sessionToken}`,
      }),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get("stats") === "true";

    // 只返回统计数据
    if (statsOnly) {
      const stats = await getUserStats(session.user.id);
      return NextResponse.json({ stats });
    }

    // 获取分页参数
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const filter = (searchParams.get("filter") || "all") as "all" | "today" | "week" | "month";

    // 获取列表数据
    const result = await getGenerationsList({
      userId: session.user.id,
      page,
      pageSize,
      filter,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Get generations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}