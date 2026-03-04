import { NextRequest, NextResponse } from "next/server";
import { getGenerationById, deleteGeneration } from "@/lib/api/generations";
import { getCloudflareContext } from "@/lib/cloudflare-context";
import { createAuth } from "@/lib/auth";
import { cookies } from "next/headers";

// 使用 Node.js runtime，因为 wrangler 的 getPlatformProxy 需要 Node.js 环境
export const runtime = "nodejs";

/**
 * 获取当前会话的用户ID
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const { env } = await getCloudflareContext();
    const auth = createAuth(env.DB, env);
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("ourapix.session")?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `ourapix.session=${sessionToken}`,
      }),
    });

    return session?.user?.id || null;
  } catch {
    return null;
  }
}

/**
 * GET /api/generations/[id]
 * 获取单个生成记录详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const record = await getGenerationById(id, userId);

    if (!record) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error("[API] Get generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/generations/[id]
 * 删除单个生成记录
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const result = await deleteGeneration(id, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Delete generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}