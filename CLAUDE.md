# OuraPix - 开发指南

> AI 驱动的跨境电商商品详情页生成器

---

## 📋 项目概述

OuraPix 是一个面向跨境电商卖家的 AI 工具，通过智能分析商品图片，自动生成高质量的商品详情页图片。

### 核心能力

- **智能分析**：AI 自动识别商品特性、卖点
- **批量生成**：一键生成 5-10 张详情图
- **风格定制**：支持上传风格参考图保持品牌一致性
- **平台适配**：内置 Amazon、Shopify 等平台尺寸预设

---

## 🏗️ 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户层                                │
│              Astro SSR (Cloudflare Pages)                   │
│                     React Islands                           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API 层                                  │
│              Hono (Cloudflare Workers)                     │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  认证模块    │  │  生成服务    │  │    支付服务         │ │
│  │ Better Auth │  │  Gemini API │  │     Stripe        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      数据层                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  D1 数据库   │  │   R2 存储   │  │     KV 缓存         │ │
│  │   SQLite    │  │  图片存储   │  │   会话/配置         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈详解

#### 前端 (frontend/)

| 技术 | 用途 | 版本 |
|------|------|------|
| Astro | SSR 框架 | v5 |
| React | 交互组件 | v18 |
| Tailwind CSS | 样式系统 | v4 |
| shadcn/ui | UI 组件库 | latest |
| Zustand | 状态管理 | latest |
| paraglide-js | i18n（类型安全） | latest |

#### 后端 (api/)

| 技术 | 用途 | 版本 |
|------|------|------|
| Hono | Web 框架 | v4 |
| Cloudflare Workers | 运行时 | - |
| Drizzle ORM | 数据库操作 | latest |
| D1 | SQLite 数据库 | - |
| R2 | 对象存储 | - |
| Better Auth | 认证系统 | v1.3 |

#### AI & 支付

| 服务 | 用途 | 配置位置 |
|------|------|----------|
| Google Gemini | 图片生成 | `GEMINI_API_KEY` |
| Stripe | 支付处理 | `STRIPE_SECRET_KEY` |

---

## 📁 项目结构

```
oura-pix/
├── api/                          # 后端 API
│   ├── src/
│   │   ├── routes/              # API 路由
│   │   │   ├── auth.ts        # 认证路由
│   │   │   ├── generate.ts    # 生成服务
│   │   │   └── payment.ts     # 支付路由
│   │   ├── lib/                 # 工具库
│   │   │   ├── auth.ts        # Better Auth 配置
│   │   │   └── storage.ts     # R2 存储工具
│   │   └── db/                  # 数据库
│   │       ├── schema.ts      # Drizzle Schema
│   │       └── migrations/    # 迁移文件
│   └── wrangler.jsonc          # Workers 配置
│
├── frontend/                     # 前端应用
│   ├── src/
│   │   ├── pages/             # Astro 页面
│   │   │   ├── index.astro    # 首页
│   │   │   ├── login.astro    # 登录页
│   │   │   └── generate.astro # 生成页
│   │   ├── components/        # React 组件
│   │   │   ├── features/      # 业务组件
│   │   │   └── ui/            # UI 组件
│   │   ├── stores/            # Zustand Store
│   │   └── lib/               # 工具函数
│   ├── messages/               # i18n 翻译文件
│   │   ├── en.json
│   │   └── zh.json
│   └── project.inlang.json     # i18n 配置
│
├── packages/                     # 共享包
│   ├── types/                  # TypeScript 类型
│   └── config/                 # 共享配置
│
├── docs/                         # 项目文档
│   ├── guides/                 # 使用指南
│   ├── reference/              # 技术参考
│   └── archive/                # 归档文档
│
└── CLAUDE.md                     # 本文件
```

---

## 🛠️ 开发规范

### 代码规范

#### TypeScript

- **严格模式**：启用 `strict: true`
- **类型安全**：禁止 `any`，使用 `unknown`
- **命名规范**：
  - 组件：PascalCase（`UserProfile.tsx`）
  - 函数/变量：camelCase（`getUserData`）
  - 常量：UPPER_SNAKE_CASE（`API_BASE_URL`）
  - 类型/接口：PascalCase + 后缀（`UserDataType`）

#### 组件开发

```typescript
// ✅ Good: 类型安全、默认导出、props 解构
interface UserCardProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserCard({ userId, onUpdate }: UserCardProps) {
  // 组件逻辑
}

// ❌ Bad: 使用 any，无类型定义
function UserCard(props: any) {
  // ...
}
```

#### API 开发

```typescript
// ✅ Good: 类型安全、错误处理
import { Hono } from 'hono';

const app = new Hono();

app.post('/generate', async (c) => {
  try {
    const body = await c.req.json<GenerateRequest>();
    // 业务逻辑
    return c.json<GenerateResponse>({ success: true, data: result });
  } catch (error) {
    console.error('[Generate Error]:', error);
    return c.json({ success: false, error: '生成失败' }, 500);
  }
});
```

### Git 提交规范

```
类型(范围): 简短描述

详细描述（可选）

Refs: 关联 issue/PR
```

**类型：**

| 类型 | 用途 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(auth): 添加 Google OAuth 登录` |
| `fix` | 修复 bug | `fix(api): 修复生成超时问题` |
| `refactor` | 重构（无功能变化） | `refactor(utils): 优化图片处理工具` |
| `docs` | 文档更新 | `docs: 更新 API 文档` |
| `test` | 测试相关 | `test: 添加生成服务单元测试` |
| `chore` | 构建/工具 | `chore(deps): 升级依赖版本` |
| `style` | 代码格式 | `style: 格式化代码` |

### 文件组织

```
src/
├── components/
│   ├── features/           # 业务功能组件
│   │   ├── generate/
│   │   │   ├── image-uploader.tsx
│   │   │   ├── style-selector.tsx
│   │   │   └── index.ts  # 统一导出
│   │   └── payment/
│   └── ui/                 # 基础 UI 组件
│       ├── button.tsx
│       ├── card.tsx
│       └── index.ts
├── lib/
│   ├── api.ts             # API 客户端
│   ├── utils.ts           # 通用工具
│   └── constants.ts       # 常量
└── hooks/
    ├── use-auth.ts
    └── use-generate.ts
```

---

## 📊 项目管理

### 工作流程

```
需求评审 → 技术方案 → 任务拆分 → 开发 → Code Review → QA → 部署
```

### 任务分配

| 角色 | 职责 |
|------|------|
| @Martin | 技术方案、任务拆分、Code Review |
| @Steven | 产品需求、UI/UX 设计 |
| @Jeff | 后端开发、API 实现 |
| @Alex | 前端开发、组件实现 |
| @Wen | QA 测试、Bug 回归 |

### 分支管理

```
main                 # 生产分支（受保护）
├── develop          # 开发分支
├── feature/*        # 功能分支
├── fix/*            # 修复分支
├── refactor/*       # 重构分支
└── docs/*           # 文档分支
```

**流程：**

1. 从 `main` 创建功能分支
2. 开发完成后提交 PR
3. @Martin Code Review
4. @jiahong-wu 合并
5. CI/CD 自动部署

### 代码审查清单

**审查者：** @Martin

**检查项：**

- [ ] 代码符合 TypeScript 严格模式
- [ ] 无 `any` 类型使用
- [ ] 错误处理完善
- [ ] 命名规范一致
- [ ] 无冗余代码
- [ ] 测试覆盖（关键路径）
- [ ] 性能无显著退化

### 发布流程

| 阶段 | 检查项 | 负责人 |
|------|--------|--------|
| **预发布** | TypeScript 编译通过 | CI |
| **构建** | 前端/后端构建成功 | CI |
| **测试** | 核心流程 E2E 通过 | @Wen |
| **部署** | Cloudflare Pages/Workers | CI/CD |
| **验证** | 生产环境功能正常 | @Steven |

---

## 🚀 开发命令

### 环境准备

```bash
# 1. 克隆仓库
git clone https://github.com/redisread/oura-pix.git
cd oura-pix

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，配置 API 密钥
```

### 日常开发

```bash
# 同时启动 API + 前端（推荐）
pnpm dev

# 单独启动
pnpm api:dev      # http://localhost:8989
pnpm web:dev      # http://localhost:4321

# 构建
pnpm api:build    # 构建后端
pnpm web:build    # 构建前端

# 类型检查
pnpm type-check

# 代码检查
pnpm lint
```

### 数据库操作

```bash
cd api/

# 生成迁移
npx drizzle-kit generate

# 应用迁移（本地）
npx drizzle-kit migrate

# 应用迁移（生产）
npx wrangler d1 migrations apply oura-pix-db --remote
```

### i18n 操作

```bash
cd frontend/

# 编译翻译（开发前必须运行）
npx @inlang/paraglide-js compile --project ./project.inlang.json --outdir ./src/paraglide

# 添加新语言（如需）
# 1. 复制 messages/en.json 为 messages/{locale}.json
# 2. 翻译内容
# 3. 更新 project.inlang.json
```

---

## 🔧 故障排查

### 常见问题

#### 1. 端口冲突

```bash
# 检查端口占用
lsof -ti:4321   # 前端
lsof -ti:8989   # API

# 清理并重启
kill -9 $(lsof -ti:4321) $(lsof -ti:8989) 2>/dev/null; pnpm dev
```

#### 2. i18n 类型错误

```bash
# 重新编译翻译
cd frontend
npx @inlang/paraglide-js compile --project ./project.inlang.json --outdir ./src/paraglide
```

#### 3. 数据库连接失败

```bash
# 检查本地 D1 状态
cd api
npx wrangler d1 execute oura-pix-db --local --command "SELECT 1"

# 重新初始化
rm -rf .wrangler/state
pnpm api:dev
```

#### 4. 构建失败

```bash
# 清理缓存
pnpm clean

# 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 重新构建
pnpm build
```

### 调试技巧

**前端调试：**

```typescript
// 在组件中添加
console.log('[Debug] Component:', { props, state });

// API 请求调试
const response = await fetch('/api/generate');
console.log('[API Response]:', response.status, await response.json());
```

**后端调试：**

```typescript
// Hono 日志中间件
app.use(async (c, next) => {
  console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`);
  await next();
});
```

---

## 📝 文档规范

### 代码注释

```typescript
/**
 * 生成商品详情图
 * @param imageUrl - 商品主图 URL
 * @param styleRef - 风格参考图 URL（可选）
 * @param platform - 目标平台（amazon/shopify/ebay）
 * @returns 生成结果，包含图片 URL 列表
 * @throws {GenerateError} 当 AI 服务不可用或参数无效时
 */
export async function generateProductImages(
  imageUrl: string,
  styleRef?: string,
  platform: Platform = 'amazon'
): Promise<GenerateResult> {
  // 实现...
}
```

### 提交信息

```
feat(generate): 添加批量生成功能

- 支持一次上传多张图片
- 添加进度条显示
- 优化错误处理

Refs: #42
```

---

## 🔄 CI/CD

### GitHub Actions

**触发条件：**

- `main` 分支推送 → 自动部署
- PR 创建 → 类型检查 + 构建测试
- 定时任务 → 依赖安全扫描

**工作流文件：** `.github/workflows/deploy.yml`

### 部署检查清单

- [ ] 环境变量已配置（Cloudflare Secrets）
- [ ] 数据库迁移已执行
- [ ] 构建产物验证通过
- [ ] 生产环境功能验证

---

## 📞 支持

**技术问题：**
- 后端：@Jeff
- 前端：@Alex
- 架构：@Martin

**产品问题：**
- 需求：@Steven
- 测试：@Wen

**紧急联系：**
- Slack: #oura-pix重构
- Email: dev@oura-pix.com

---

## 📚 参考文档

- [Astro 文档](https://docs.astro.build/)
- [Hono 文档](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Better Auth](https://www.better-auth.com/)
- [paraglide-js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)

---

*最后更新：2026-05-24*
