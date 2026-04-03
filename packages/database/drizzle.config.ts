import type { Config } from "drizzle-kit";

/**
 * Drizzle ORM Configuration for @oura-pix/database package
 */
export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || "",
    token: process.env.CLOUDFLARE_D1_TOKEN || "",
  },
  migrations: {
    table: "__drizzle_migrations__",
    schema: "public",
  },
  strict: true,
  verbose: true,
} satisfies Config;
