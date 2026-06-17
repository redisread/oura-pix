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
  // 图片类型：product(商品图), reference(参考图), generated_scene(生成的场景图)
  type: text("type", { enum: ["product", "reference", "generated_scene"] }).notNull(),
  // 文件大小 (字节)
  size: integer("size").notNull(),
  // MIME 类型
  mimeType: text("mimeType").notNull(),
  // 图片宽度
  width: integer("width"),
  // 图片高度
  height: integer("height"),
  // 关联的生成任务 ID (仅用于 generated_scene 类型)
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
  // 关联的商品图片 ID
  productImageId: text("productImageId")
    .references(() => images.id, { onDelete: "set null" }),
  // 关联的参考图片 ID 列表 (JSON 数组)
  referenceImageIds: text("referenceImageIds", { mode: "json" }).$type<string[]>().default([]),
  // 用户输入的提示词
  prompt: text("prompt"),
  // 生成设置 (JSON)
  settings: text("settings", { mode: "json" }).$type<GenerationSettings>().notNull().default({}),
  // 生成结果 (JSON 数组)
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
  // 处理阶段：analyzing | generating_text | generating_images | uploading | completed
  processingStage: text("processingStage", {
    enum: ["analyzing", "generating_text", "generating_images", "uploading", "completed"],
  }),
  // 当前阶段开始时间 (用于检测超时)
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
 * 图片收藏表
 */
export const favorites = sqliteTable("favorites", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 关联的生成任务 ID
  generationId: text("generationId")
    .notNull()
    .references(() => generations.id, { onDelete: "cascade" }),
  // 收藏的图片 URL
  imageUrl: text("imageUrl").notNull(),
  // 图片在生成结果中的索引
  imageIndex: integer("imageIndex"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  userIdIdx: index("favorites_userId_idx").on(table.userId),
  userIdGenerationIdx: index("favorites_userId_generationId_idx").on(table.userId, table.generationId),
  // 确保同一用户不会重复收藏同一张图片
  uniqueFavorite: index("favorites_unique_idx").on(table.userId, table.imageUrl),
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
  // 结果 ID
  id: string;
  // 生成的标题
  title: string;
  // 生成的描述
  description: string;
  // 生成的标签/关键词
  tags: string[];
  // 生成的图片 URL(如果有)
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
  // 支付方式 ID(外部支付系统)
  paymentMethodId: text("paymentMethodId"),
  // 订阅 ID(外部支付系统)
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
 * 使用记录表 (用于统计和审计)
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
  // 关联的生成任务 ID
  generationId: text("generationId").references(() => generations.id),
  // 使用详情 (JSON)
  details: text("details").$type<Record<string, unknown>>(),
  // 消耗额度
  creditsUsed: integer("creditsUsed").default(1),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
});

/**
 * 通知类型枚举
 */
export const NotificationType = {
  GENERATION_COMPLETE: "generation_complete",
  GENERATION_FAILED: "generation_failed",
  SYSTEM_ANNOUNCEMENT: "system_announcement",
  ACCOUNT_UPDATE: "account_update",
  SUBSCRIPTION_RENEWAL: "subscription_renewal",
  SUBSCRIPTION_EXPIRING: "subscription_expiring",
} as const;

export type NotificationTypeType =
  typeof NotificationType[keyof typeof NotificationType];

/**
 * 通知表
 */
export const notifications = sqliteTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 通知类型
  type: text("type", {
    enum: [
      "generation_complete",
      "generation_failed",
      "system_announcement",
      "account_update",
      "subscription_renewal",
      "subscription_expiring",
    ],
  }).notNull(),
  // 通知标题
  title: text("title").notNull(),
  // 通知内容
  message: text("message").notNull(),
  // 跳转链接（可选）
  link: text("link"),
  // 关联的资源 ID（如 generationId）
  resourceId: text("resourceId"),
  // 是否已读
  isRead: integer("isRead", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  userIdIdx: index("notifications_userId_idx").on(table.userId),
  userIdIsReadIdx: index("notifications_userId_isRead_idx").on(table.userId, table.isRead),
  createdAtIdx: index("notifications_createdAt_idx").on(table.createdAt),
}));

/**
 * 错误严重程度枚举
 */
export const ErrorSeverity = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export type ErrorSeverityType = typeof ErrorSeverity[keyof typeof ErrorSeverity];

/**
 * 错误类型枚举
 */
export const ErrorType = {
  NETWORK: "network",
  VALIDATION: "validation",
  AUTHENTICATION: "authentication",
  BUSINESS_LOGIC: "business_logic",
  RUNTIME: "runtime",
  UNKNOWN: "unknown",
} as const;

export type ErrorTypeType = typeof ErrorType[keyof typeof ErrorType];

/**
 * 错误模块枚举
 */
export const ErrorModule = {
  API: "api",
  FRONTEND: "frontend",
  WORKER: "worker",
  DATABASE: "database",
} as const;

export type ErrorModuleType = typeof ErrorModule[keyof typeof ErrorModule];

/**
 * 错误追踪表
 *
 * 记录前端和后端错误，用于问题定位和稳定性监控
 */
export const errors = sqliteTable("errors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // 错误消息
  message: text("message").notNull(),
  // 堆栈信息
  stack: text("stack"),
  // 严重程度
  severity: text("severity", {
    enum: ["critical", "high", "medium", "low"],
  })
    .notNull()
    .default("medium"),
  // 错误类型
  type: text("type", {
    enum: ["network", "validation", "authentication", "business_logic", "runtime", "unknown"],
  })
    .notNull()
    .default("unknown"),
  // 来源模块
  module: text("module", {
    enum: ["api", "frontend", "worker", "database"],
  })
    .notNull()
    .default("frontend"),
  // 上下文信息（URL、用户代理、用户 ID、操作历史等 JSON 字符串）
  context: text("context"),
  // 用于去重的错误指纹（message + stack[:3] 的 hash）
  hash: text("hash").notNull(),
  // 出现次数
  occurrences: integer("occurrences").notNull().default(1),
  // 最后一次出现时间
  lastSeenAt: integer("lastSeenAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
  // 首次出现时间
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  hashIdx: index("errors_hash_idx").on(table.hash),
  severityIdx: index("errors_severity_idx").on(table.severity),
  typeIdx: index("errors_type_idx").on(table.type),
  moduleIdx: index("errors_module_idx").on(table.module),
  lastSeenAtIdx: index("errors_lastSeenAt_idx").on(table.lastSeenAt),
  createdAtIdx: index("errors_createdAt_idx").on(table.createdAt),
}));

/**
 * 性能指标名枚举（对应 web-vitals）
 */
export const MetricName = {
  // Core Web Vitals
  LCP: "LCP",         // Largest Contentful Paint
  INP: "INP",         // Interaction to Next Paint
  CLS: "CLS",         // Cumulative Layout Shift
  FCP: "FCP",         // First Contentful Paint
  TTFB: "TTFB",       // Time to First Byte
  // Navigation timing
  NAV_DOM: "navigation.domContentLoaded",
  NAV_LOAD: "navigation.load",
} as const;

export type MetricNameType = typeof MetricName[keyof typeof MetricName];

/**
 * 性能指标表
 *
 * 记录前端 Web Vitals 和导航时序指标，用于性能监控
 */
export const metrics = sqliteTable("metrics", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // 指标名
  name: text("name").notNull(),
  // 指标值（CLS 等无单位指标保留原始数值；时间类指标为毫秒）
  value: real("value").notNull(),
  // 评分（good / needs-improvement / poor），可选
  rating: text("rating", {
    enum: ["good", "needs-improvement", "poor"],
  }),
  // 当前页面 URL
  url: text("url"),
  // 用户代理
  userAgent: text("userAgent"),
  // 设备类型（mobile / tablet / desktop），基于 viewport 宽度
  deviceType: text("deviceType", {
    enum: ["mobile", "tablet", "desktop"],
  }),
  // 网络类型（effectiveType，来自 navigator.connection）
  connectionType: text("connectionType"),
  // 附加上下文 JSON
  context: text("context"),
  recordedAt: integer("recordedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  nameIdx: index("metrics_name_idx").on(table.name),
  ratingIdx: index("metrics_rating_idx").on(table.rating),
  recordedAtIdx: index("metrics_recordedAt_idx").on(table.recordedAt),
  nameRecordedAtIdx: index("metrics_name_recordedAt_idx").on(table.name, table.recordedAt),
}));

/**
 * API 密钥表
 *
 * 存储用户生成的 API Key 哈希值，永不存明文。
 * 完整 key 仅在创建时返回一次。
 */
export const apiKeys = sqliteTable("api_keys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 用户自定义名称
  name: text("name").notNull(),
  // 展示用前缀，例如 "op_a1b2c3"
  keyPrefix: text("keyPrefix").notNull(),
  // 完整 key 的 SHA-256 哈希
  keyHash: text("keyHash").notNull().unique(),
  // 最后使用时间
  lastUsedAt: integer("lastUsedAt", { mode: "timestamp_ms" }),
  // 过期时间（可选）
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }),
  // 是否已吊销
  isRevoked: integer("isRevoked", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  userIdIdx: index("api_keys_userId_idx").on(table.userId),
  keyHashIdx: index("api_keys_keyHash_idx").on(table.keyHash),
}));

/**
 * 团队角色枚举
 */
export const TeamRole = {
  OWNER: "owner",
  ADMIN: "admin",
  MEMBER: "member",
} as const;

export type TeamRoleType = typeof TeamRole[keyof typeof TeamRole];

/**
 * 团队表
 */
export const teams = sqliteTable("teams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  // 团队名称
  name: text("name").notNull(),
  // 团队所有者（创建者）
  ownerId: text("ownerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 邀请码（如 "TEAM-A1B2C3"）
  inviteCode: text("inviteCode").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  ownerIdIdx: index("teams_ownerId_idx").on(table.ownerId),
  inviteCodeIdx: index("teams_inviteCode_idx").on(table.inviteCode),
}));

/**
 * 团队成员表
 */
export const teamMembers = sqliteTable("team_members", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("teamId")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role", {
    enum: ["owner", "admin", "member"],
  })
    .notNull()
    .default("member"),
  joinedAt: integer("joinedAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  teamIdIdx: index("team_members_teamId_idx").on(table.teamId),
  userIdIdx: index("team_members_userId_idx").on(table.userId),
  // Unique constraint on (teamId, userId) is implicit via primary keys? No — must add explicit unique index
  teamUserUniqueIdx: index("team_members_teamId_userId_unique_idx").on(table.teamId, table.userId),
}));

/**
 * 竞品表
 *
 * 记录用户关注的竞品链接、平台、截图和笔记。
 * P0 范围：手动添加 + 列表 + 删除。不做抓取和 AI 分析。
 */
export const competitors = sqliteTable("competitors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  platform: text("platform").notNull().default("other"),
  url: text("url").notNull(),
  screenshots: text("screenshots").notNull().default("[]"),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  userIdIdx: index("competitors_userId_idx").on(table.userId),
  platformIdx: index("competitors_platform_idx").on(table.platform),
  createdAtIdx: index("competitors_createdAt_idx").on(table.createdAt),
}));

