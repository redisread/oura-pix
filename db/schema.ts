import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";

// OAuth 账户类型
type AdapterAccountType = "oauth" | "email" | "credentials";

/**
 * 用户表 - Better Auth 集成
 */
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  password: text("password"), // 邮箱/密码登录用
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * 账户表 - OAuth 登录用
 */
export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

/**
 * 会话表 - Better Auth 标准结构
 */
export const sessions = sqliteTable("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  token: text("token").notNull().unique(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * 验证令牌表
 */
export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (verToken) => ({
    compoundKey: primaryKey({ columns: [verToken.identifier, verToken.token] }),
  })
);

/**
 * 图片上传记录表
 */
export const images = sqliteTable("images", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 图片原始文件名
  originalName: text("originalName").notNull(),
  // 存储路径/URL
  url: text("url").notNull(),
  // 图片类型: product(商品图), reference(参考图)
  type: text("type", { enum: ["product", "reference"] }).notNull(),
  // 文件大小(字节)
  size: integer("size").notNull(),
  // MIME类型
  mimeType: text("mimeType").notNull(),
  // 图片宽度
  width: integer("width"),
  // 图片高度
  height: integer("height"),
  // 是否已删除
  isDeleted: integer("isDeleted", { mode: "boolean" }).default(false),
  // 删除时间
  deletedAt: integer("deletedAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * 生成任务状态枚举
 */
export const GenerationStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type GenerationStatusType =
  typeof GenerationStatus[keyof typeof GenerationStatus];

/**
 * AI 生成任务表
 */
export const generations = sqliteTable("generations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 任务状态
  status: text("status", {
    enum: ["pending", "processing", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  // 关联的商品图片ID
  productImageId: text("productImageId")
    .references(() => images.id, { onDelete: "set null" }),
  // 关联的参考图片ID列表(JSON数组)
  referenceImageIds: text("referenceImageIds").$type<string[]>(),
  // 用户输入的提示词
  prompt: text("prompt"),
  // 生成设置(JSON)
  settings: text("settings").$type<GenerationSettings>(),
  // 生成结果(JSON数组)
  results: text("results").$type<GenerationResult[]>(),
  // 错误信息
  errorMessage: text("errorMessage"),
  // 完成时间
  completedAt: integer("completedAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * 生成设置类型
 */
export interface GenerationSettings {
  // 目标平台
  targetPlatform?: "amazon" | "ebay" | "shopify" | "etsy" | "generic";
  // 目标语言
  language?: string;
  // 生成数量
  count?: number;
  // 风格偏好
  style?: "professional" | "lifestyle" | "minimal" | "luxury";
  // 额外配置
  extra?: Record<string, unknown>;
}

/**
 * 生成结果类型
 */
export interface GenerationResult {
  // 结果ID
  id: string;
  // 生成的标题
  title: string;
  // 生成的描述
  description: string;
  // 生成的标签/关键词
  tags: string[];
  // 生成的图片URL(如果有)
  imageUrl?: string;
  // 置信度分数
  confidenceScore?: number;
  // 元数据
  metadata?: Record<string, unknown>;
}

/**
 * 订阅计划类型
 */
export const SubscriptionPlan = {
  FREE: "free",
  BASIC: "basic",
  PRO: "pro",
  ENTERPRISE: "enterprise",
} as const;

export type SubscriptionPlanType =
  typeof SubscriptionPlan[keyof typeof SubscriptionPlan];

/**
 * 订阅信息表
 */
export const subscriptions = sqliteTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  // 订阅计划
  plan: text("plan", {
    enum: ["free", "basic", "pro", "enterprise"],
  })
    .notNull()
    .default("free"),
  // 订阅状态
  status: text("status", {
    enum: ["active", "canceled", "past_due", "unpaid", "trialing"],
  })
    .notNull()
    .default("active"),
  // 当前周期开始时间
  currentPeriodStart: integer("currentPeriodStart", {
    mode: "timestamp_ms",
  }),
  // 当前周期结束时间
  currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp_ms" }),
  // 已使用生成次数
  usedGenerations: integer("usedGenerations").notNull().default(0),
  // 月度生成限额
  generationLimit: integer("generationLimit").notNull().default(10),
  // 支付方式ID(外部支付系统)
  paymentMethodId: text("paymentMethodId"),
  // 订阅ID(外部支付系统)
  externalSubscriptionId: text("externalSubscriptionId"),
  // 取消时间
  canceledAt: integer("canceledAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * 使用记录表(用于统计和审计)
 */
export const usageLogs = sqliteTable("usage_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 使用类型
  type: text("type", {
    enum: ["generation", "upload", "download"],
  }).notNull(),
  // 关联的生成任务ID
  generationId: text("generationId").references(() => generations.id),
  // 使用详情(JSON)
  details: text("details").$type<Record<string, unknown>>(),
  // 消耗额度
  creditsUsed: integer("creditsUsed").default(1),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
