import { sql, type InferSelectModel } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import {
  integer,
  real,
  sqliteTable,
  text,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";

/**
 * 用户表 - Better Auth 集成
 * 使用 integer mode: 'timestamp_ms' 自动处理 Date 对象与毫秒时间戳的转换
 */
export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).default(false),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

/**
 * 账户表 - Better Auth 标准
 * 用于邮箱/密码登录和 OAuth 登录
 */
export const accounts = sqliteTable("account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

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
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

/**
 * 验证令牌表 - Better Auth 标准
 */
export const verificationTokens = sqliteTable("verificationToken", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

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
  // 图片类型: product(商品图), reference(参考图), generated_scene(生成的场景图)
  type: text("type", { enum: ["product", "reference", "generated_scene"] }).notNull(),
  // 文件大小(字节)
  size: integer("size").notNull(),
  // MIME类型
  mimeType: text("mimeType").notNull(),
  // 图片宽度
  width: integer("width"),
  // 图片高度
  height: integer("height"),
  // 关联的生成任务ID (仅用于 generated_scene 类型)
  // 注意：不在数据库层设置外键约束，避免循环引用问题
  generationId: text("generationId"),
  // 生成此图片使用的提示词 (仅用于 generated_scene 类型)
  promptUsed: text("promptUsed"),
  // 是否已删除
  isDeleted: integer("isDeleted", { mode: "boolean" }).default(false),
  // 删除时间
  deletedAt: integer("deletedAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  userIdIsDeletedIdx: index("images_userId_isDeleted_idx").on(table.userId, table.isDeleted),
}));

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
 * 处理阶段枚举
 */
export const ProcessingStage = {
  ANALYZING: "analyzing",
  GENERATING_TEXT: "generating_text",
  GENERATING_IMAGES: "generating_images",
  UPLOADING: "uploading",
  COMPLETED: "completed",
} as const;

export type ProcessingStageType =
  typeof ProcessingStage[keyof typeof ProcessingStage];

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
  referenceImageIds: text("reference_image_ids", { mode: "json" }).$type<string[]>().default([]),
  // 用户输入的提示词
  prompt: text("prompt"),
  // 生成设置(JSON)
  settings: text("settings", { mode: "json" }).$type<GenerationSettings>().notNull().default({}),
  // 生成结果(JSON数组)
  results: text("results", { mode: "json" }).$type<GenerationResult[]>(),
  // 生成的场景图数量
  generatedImageCount: integer("generatedImageCount").default(0),
  // 图像生成状态
  imageGenerationStatus: text("imageGenerationStatus", {
    enum: ["pending", "processing", "completed", "failed", "skipped"],
  }),
  // 图像生成错误信息
  imageGenerationError: text("imageGenerationError"),
  // 错误信息
  errorMessage: text("errorMessage"),
  // 处理阶段: analyzing | generating_text | generating_images | uploading | completed
  processingStage: text("processingStage", {
    enum: ["analyzing", "generating_text", "generating_images", "uploading", "completed"],
  }),
  // 当前阶段开始时间(用于检测超时)
  stageStartedAt: integer("stageStartedAt", { mode: "timestamp_ms" }),
  // 完成时间
  completedAt: integer("completedAt", { mode: "timestamp_ms" }),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  userIdCreatedAtIdx: index("generations_userId_createdAt_idx").on(table.userId, table.createdAt),
  userIdStatusIdx: index("generations_userId_status_idx").on(table.userId, table.status),
  statusStageStartedAtIdx: index("generations_status_stageStartedAt_idx").on(table.status, table.stageStartedAt),
}));

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
  // 是否生成场景图
  generateImages?: boolean;
  // 场景图生成数量
  imageCount?: number;
  // 图片宽高比
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  // 是否允许生成人物
  allowPersons?: boolean;
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
  // 生成的场景图列表
  sceneImages?: Array<{
    imageId: string;
    url: string;
    aspectRatio: string;
    width: number;
    height: number;
    promptUsed: string;
    variation: number;
  }>;
  // 元数据
  metadata?: Record<string, unknown>;
}

/**
 * 订阅计划类型
 */
export const SubscriptionPlan = {
  FREE: "free",
  STARTER: "starter",
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
    enum: ["free", "starter", "pro", "enterprise"],
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
  currentPeriodStart: integer("currentPeriodStart", { mode: "timestamp_ms" }),
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
    .default(sql`(strftime('%s', 'now') * 1000)`),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
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
    .default(sql`(strftime('%s', 'now') * 1000)`),
});
