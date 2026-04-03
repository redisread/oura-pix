# OuraPix 前后端分离改造迁移手册

本文档记录了从单体应用到前后端分离架构的迁移步骤和配置。

## 迁移状态

### 已完成 (Phase 1-3)

- [x] 创建 Monorepo 目录结构
- [x] 配置 pnpm workspace 和 Turborepo
- [x] 创建共享包 `@oura-pix/database`
- [x] 创建共享包 `@oura-pix/api-client`
- [x] 创建 Hono API 应用 (`apps/api`)
- [x] 迁移认证路由到 Hono
- [x] 迁移生成任务 API 到 Hono
- [x] 迁移上传 API 到 Hono
- [x] 迁移订阅 API 到 Hono
- [x] 迁移 Stripe Webhook 到 Hono
- [x] 配置 API Worker 部署 (`apps/api/wrangler.jsonc`)
- [x] 分离 Next.js Web 前端 (`apps/web`)
- [x] 配置 Web Pages 部署 (`apps/web/wrangler.jsonc`)
- [x] 更新前端 API 调用使用新 API 客户端
- [x] 本地测试验证 (API 和 Web 同时运行)

### 进行中 (Phase 4)

- [ ] 完整功能测试 (认证/生成/上传/订阅)
- [ ] 生产环境部署
- [ ] 生产环境验证

---

## 新架构概览

```
oura-pix/
├── apps/
│   ├── api/              # Cloudflare Workers + Hono 后端
│   ├── web/              # Next.js 前端 (Cloudflare Pages)
│   └── mobile/           # Expo 移动端 (待开发)
├── packages/
│   ├── api-client/       # 通用 API 客户端
│   ├── database/         # 数据库共享包
│   └── config/           # 共享配置
├── package.json          # Root package (workspaces)
├── pnpm-workspace.yaml   # pnpm workspace 配置
└── turbo.json            # Turborepo 配置
```

---

## 目录结构说明

### apps/api - 后端 API

```
apps/api/
├── src/
│   ├── index.ts                  # Hono app 入口
│   ├── routes/                   # API 路由
│   │   ├── auth.ts               # 认证路由
│   │   ├── generations.ts        # 生成任务路由
│   │   ├── upload.ts             # 上传路由
│   │   ├── subscription.ts       # 订阅路由
│   │   └── webhooks/stripe.ts    # Stripe Webhook
│   ├── services/                 # 业务逻辑层
│   │   └── generation-service.ts
│   ├── middleware/               # Hono 中间件
│   │   └── auth.ts               # 认证中间件
│   └── lib/                      # 工具库
│       ├── cloudflare.ts         # Cloudflare 上下文
│       └── mail.ts               # 邮件服务
├── package.json
└── wrangler.jsonc                # Worker 配置
```

### apps/web - 前端 Web

```
apps/web/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 首页
│   ├── generate/             # 生成页面
│   ├── history/              # 历史记录
│   ├── profile/              # 用户中心
│   └── login/                # 登录注册
├── components/               # React 组件
├── hooks/                    # React Hooks
├── lib/                      # 工具函数
│   ├── auth.ts               # 认证 API 调用
│   └── api.ts                # API 客户端 (可选)
├── i18n/                     # 国际化资源
├── package.json
├── next.config.js
├── wrangler.jsonc            # Pages 配置
└── .env.local                # 环境变量
```

**关键改动**:
- 移除了 `app/api/` 目录 (不再有服务端 API routes)
- 移除了服务端 AI/数据库工具 (`lib/ai/`, `lib/r2.ts` 等)
- 所有 API 调用通过 fetch 指向外部 API Worker
- 使用 Cookie 进行认证 (与 API 同域时)

### packages/database - 数据库共享包

```
packages/database/
├── src/
│   ├── index.ts                  # 导出
│   └── schema.ts                 # Drizzle schema
├── package.json
└── tsconfig.json
```

### packages/api-client - API 客户端包

```
packages/api-client/
├── src/
│   ├── index.ts                  # 导出
│   ├── client.ts                 # HTTP 客户端
│   ├── endpoints.ts              # API 端点定义
│   └── types.ts                  # API 类型定义
├── package.json
└── tsconfig.json
```

---

## 开发工作流程

### 安装依赖

```bash
pnpm install
```

### 启动开发环境

```bash
# 启动所有应用 (API + Web)
pnpm dev

# 只启动 API
pnpm dev:api

# 只启动 Web
pnpm dev:web
```

### 构建

```bash
# 构建所有
pnpm build

# 只构建 API
pnpm build:api

# 只构建 Web
pnpm build:web
```

### 数据库操作

```bash
# 生成迁移
pnpm db:generate

# 本地应用迁移
pnpm db:migrate:local

# 生产环境应用迁移
pnpm db:migrate:prod

# 打开数据库管理界面
pnpm db:studio
```

---

## API 端点

### 认证 (POST /api/auth/*)

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/auth/sign-in | POST | 用户登录 |
| /api/auth/sign-up | POST | 用户注册 |
| /api/auth/sign-out | POST | 用户登出 |
| /api/auth/session | GET | 获取会话 |
| /api/auth/forgot-password | POST | 忘记密码 |
| /api/auth/reset-password | POST | 重置密码 |

### 生成任务 (GET/POST /api/generations)

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/generations | GET | 获取生成历史列表 |
| /api/generations | POST | 创建生成任务 |
| /api/generations/:id | GET | 获取单个生成记录 |
| /api/generations/:id | DELETE | 删除生成记录 |

### 图片上传 (POST /api/upload/*)

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/upload/signed-url | POST | 获取签名上传 URL |
| /api/upload/direct | POST | 直接上传到 R2 |

### 订阅 (GET/POST /api/subscription/*)

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/subscription | GET | 获取当前订阅 |
| /api/subscription/checkout | POST | 创建 Stripe 结算会话 |
| /api/subscription/portal | POST | 创建计费门户会话 |

### Webhooks (POST /api/webhooks/*)

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/webhooks/stripe | POST | Stripe Webhook 处理 |

---

## 环境变量配置

### apps/api/.dev.vars (本地开发)

```bash
# Better Auth
BETTER_AUTH_SECRET=your-local-secret-key-min-32-chars

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs
STRIPE_STARTER_PRICE_ID=price_xxx
STRIPE_PRO_PRICE_ID=price_xxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxx

# Gemini API
GEMINI_API_KEY=xxx

# Resend
RESEND_API_KEY=re_xxx

# OAuth (可选)
AUTH_GOOGLE_ID=xxx
AUTH_GOOGLE_SECRET=xxx
AUTH_GITHUB_ID=xxx
AUTH_GITHUB_SECRET=xxx
```

### 生产环境配置

```bash
# API Secrets (使用 Wrangler 命令设置)
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put GEMINI_API_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put AUTH_GOOGLE_ID
wrangler secret put AUTH_GOOGLE_SECRET
wrangler secret put AUTH_GITHUB_ID
wrangler secret put AUTH_GITHUB_SECRET

# Web Secrets
wrangler pages secret put BETTER_AUTH_SECRET
```

---

## 部署流程

### 部署 API 到 Cloudflare Workers

```bash
cd apps/api
pnpm deploy
```

或使用根目录命令:

```bash
pnpm api:deploy
```

### 部署 Web 到 Cloudflare Pages

```bash
cd apps/web
pnpm deploy
```

或使用根目录命令:

```bash
pnpm web:deploy
```

---

## 下一步工作

### Phase 3: 前端迁移

1. **更新 API 调用**
   - 将现有的 API routes 调用改为使用 `@oura-pix/api-client`
   - 更新认证逻辑使用新的 API 端点

2. **移除单体依赖**
   - 删除 `app/api/` 目录
   - 移除 Better Auth 服务端集成
   - 保留客户端认证逻辑

3. **配置环境变量**
   - 设置 `NEXT_PUBLIC_API_URL` 指向 API Worker

### Phase 4: 移动端开发 (待规划)

1. 创建 Expo 项目
2. 集成 `@oura-pix/api-client`
3. 实现认证和核心功能

---

## 技术栈

| 组件 | 技术 |
|------|------|
| **后端** | Hono, Cloudflare Workers, Drizzle ORM |
| **前端** | Next.js 15, React 18, Tailwind CSS |
| **数据库** | Cloudflare D1 (SQLite) |
| **存储** | Cloudflare R2 |
| **认证** | Better Auth |
| **支付** | Stripe |
| **邮件** | Resend |
| **AI** | Google Generative AI (Gemini) |
| **Monorepo** | pnpm + Turborepo |

---

## 常见问题

### Q: 本地开发时如何同时运行 API 和 Web?

```bash
pnpm dev  # 在根目录运行，会同时启动 API 和 Web
```

### Q: 如何测试 API?

API 运行在 `http://localhost:8787`，可以使用以下命令测试:

```bash
curl http://localhost:8787/health
```

### Q: 数据库迁移怎么做?

```bash
# 生成本地迁移
pnpm db:generate

# 应用本地迁移
pnpm db:migrate:local

# 应用生产迁移
pnpm db:migrate:prod
```

### Q: 如何添加新的 API 端点?

1. 在 `apps/api/src/routes/` 创建新的路由文件
2. 在 `apps/api/src/index.ts` 中注册路由
3. 在 `packages/api-client/src/endpoints.ts` 添加端点定义
4. 在 `packages/api-client/src/types.ts` 添加类型定义

---

## 参考资源

- [OpenNext Cloudflare 文档](https://opennext.js.org/cloudflare/get-started)
- [Hono 文档](https://hono.dev/)
- [Better Auth 文档](https://www.better-auth.com/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
