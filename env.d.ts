/// <reference types="@cloudflare/workers-types" />

/**
 * 扩展 Cloudflare 环境变量类型定义
 * 通过声明合并添加 D1 数据库和 R2 存储的绑定
 */
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    R2: R2Bucket;
  }

  namespace NodeJS {
    interface ProcessEnv {
      AUTH_SECRET: string;
      NEXT_PUBLIC_APP_URL: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      GITHUB_CLIENT_ID?: string;
      GITHUB_CLIENT_SECRET?: string;
      GEMINI_API_KEY?: string;
      STRIPE_SECRET_KEY?: string;
      STRIPE_WEBHOOK_SECRET?: string;
      CLOUDFLARE_D1_DATABASE_ID?: string;
      CLOUDFLARE_R2_BUCKET_NAME?: string;
    }
  }
}

export {};
