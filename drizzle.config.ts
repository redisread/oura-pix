import type { Config } from "drizzle-kit";

/**
 * Drizzle ORM 配置文件
 * 用于数据库迁移和类型生成
 */
export default {
  // Schema 文件路径
  schema: "./db/schema.ts",
  // 迁移文件输出目录
  out: "./drizzle/migrations",
  // 数据库方言
  dialect: "sqlite",
  // 驱动配置(用于 D1)
  driver: "d1-http",
  // 数据库凭证(从环境变量读取)
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || "",
    token: process.env.CLOUDFLARE_D1_TOKEN || "",
  },
  // 迁移表配置
  migrations: {
    table: "__drizzle_migrations__",
    schema: "public",
  },
  // 严格模式
  strict: true,
  // 详细日志
  verbose: true,
} satisfies Config;
