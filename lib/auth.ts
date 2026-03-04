import type { D1Database } from "@cloudflare/workers-types";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb, schema } from "@/db";
import { sendPasswordResetEmail } from "./mail";
import type { CloudflareEnv } from "./cloudflare-context";

/**
 * Better Auth 配置
 * 支持邮箱/密码登录和会话管理
 * 使用 Drizzle 的 integer mode: 'timestamp_ms' 自动处理 Date 对象转换
 */
export function createAuth(d1Database: D1Database, env: CloudflareEnv) {
  const db = createDb(d1Database);
  const baseUrl = env.BETTER_AUTH_URL
    || env.NEXT_PUBLIC_APP_URL
    || "http://localhost:4001";

  // 动态构建 trustedOrigins,而不是硬编码
  const trustedOrigins = [baseUrl];

  // 开发环境额外信任 localhost
  if (process.env.NODE_ENV === 'development') {
    trustedOrigins.push("http://localhost:4001", "http://127.0.0.1:4001");
  }

  return betterAuth({
    // 基础配置
    baseURL: baseUrl,
    secret: env.AUTH_SECRET,
    trustedOrigins, // 使用动态构建的数组

    // 数据库适配器配置
    database: drizzleAdapter(db, {
      provider: "sqlite",
      camelCase: true, // 使用 camelCase 字段名映射
      schema: {
        user: schema.users,
        account: schema.accounts,
        session: schema.sessions,
        verification: schema.verificationTokens,
      },
    }),

    // 认证方式配置
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        // 发送密码重置邮件，直接传入 env 避免在深层回调中重新获取 Cloudflare 上下文
        await sendPasswordResetEmail(
          { email: user.email, name: user.name || undefined },
          { resetUrl: url, userName: user.name || user.email },
          env
        );
      },
    },

    // 会话配置
    session: {
      // 会话过期时间 - Better Auth Cookie maxAge 使用秒值
      // 7天 = 7 * 24 * 60 * 60 = 604800 秒
      expiresIn: 604800, // 7天（秒）
      // 更新会话频率 - 1天 = 86400 秒
      updateAge: 86400, // 1天（秒）
      // Cookie 名称
      cookieName: "ourapix.session",
      // Cookie 配置
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5分钟缓存
      },
    },

    // 社交登录配置(可选) - 只在配置了环境变量时启用
    socialProviders: {
      ...(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
        ? {
            google: {
              clientId: env.AUTH_GOOGLE_ID,
              clientSecret: env.AUTH_GOOGLE_SECRET,
            },
          }
        : {}),
      ...(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET
        ? {
            github: {
              clientId: env.AUTH_GITHUB_ID,
              clientSecret: env.AUTH_GITHUB_SECRET,
            },
          }
        : {}),
    },

    // 高级配置
    advanced: {
      // 开发环境使用 HTTP，生产环境使用 HTTPS
      useSecureCookies: process.env.NODE_ENV === "production",
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
