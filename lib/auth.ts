import type { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb, schema } from "@/db";

/**
 * Better Auth 配置
 * 支持邮箱/密码登录和会话管理
 */
export function createAuth(d1Database: D1Database) {
  const db = createDb(d1Database);

  return betterAuth({
    // 基础配置
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    secret: process.env.AUTH_SECRET,

    // 数据库适配器配置
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.users,
        account: schema.accounts,
        session: schema.sessions,
        verificationToken: schema.verificationTokens,
      },
    }),

    // 认证方式配置
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
    },

    // 会话配置
    session: {
      // 会话过期时间(毫秒)
      expiresIn: 7 * 24 * 60 * 60 * 1000, // 7天
      // 更新会话频率
      updateAge: 24 * 60 * 60 * 1000, // 1天
    },

    // Cookie 配置
    cookies: {
      sessionToken: {
        name: "ourapix.session",
        secure: true,
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      },
    },

    // 社交登录配置(可选)
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      },
    },

    // 高级配置
    advanced: {
      // 使用安全头部
      useSecureCookies: true,
    },

  });
}

/**
 * Auth 类型导出
 */
export type Auth = ReturnType<typeof createAuth>;

/**
 * 会话类型
 */
export interface Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
}

/**
 * 验证会话
 * @param auth Auth 实例
 * @param sessionToken 会话令牌
 * @returns 会话信息或 null
 */
export async function validateSession(
  auth: Auth,
  sessionToken: string
): Promise<Session | null> {
  try {
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: `ourapix.session=${sessionToken}`,
      }),
    });
    return session as Session | null;
  } catch {
    return null;
  }
}

/**
 * 获取当前用户
 * @param auth Auth 实例
 * @param request 请求对象
 * @returns 当前用户或 null
 */
export async function getCurrentUser(
  auth: Auth,
  request: Request
): Promise<Session["user"] | null> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return session?.user || null;
  } catch {
    return null;
  }
}
