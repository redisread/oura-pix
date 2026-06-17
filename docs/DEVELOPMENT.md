# OuraPix 开发文档

## 技术栈

| 层级 | 技术 | 选择理由 |
|------|------|----------|
| 前端 | Astro + React | 高性能、SEO 友好、组件化 |
| 样式 | Tailwind + Shadcn | 快速开发、设计系统一致 |
| 状态 | Zustand | 轻量、TypeScript 友好 |
| 后端 | Cloudflare Workers | 边缘部署、低延迟 |
| 数据库 | Cloudflare D1 | Serverless、自动扩缩 |
| 存储 | Cloudflare R2 | 兼容 S3、成本优化 |
| AI | Google Gemini | 图片生成质量高 |
| 支付 | Stripe | 全球覆盖、Webhook 完善 |
| 认证 | Better Auth | 安全、易集成 |
| 国际化 | paraglide-js | 类型安全、高性能 |

## 项目结构

```
oura-pix/
├── api/                    # Cloudflare Workers API
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   │   ├── auth.ts     # 认证路由
│   │   │   ├── generations.ts  # 生成任务路由
│   │   │   ├── images.ts   # 图片路由
│   │   │   ├── users.ts    # 用户路由
│   │   │   ├── favorites.ts    # 收藏路由
│   │   │   ├── notifications.ts # 通知路由
│   │   │   ├── metrics.ts  # 性能指标路由
│   │   │   ├── errors.ts   # 错误追踪路由
│   │   │   ├── keys.ts     # API 密钥路由
│   │   │   ├── teams.ts    # 团队路由
│   │   │   └── v1/         # 公共 API v1
│   │   ├── middleware/     # 中间件
│   │   │   ├── auth.ts     # 认证中间件
│   │   │   ├── apiKeyAuth.ts   # API Key 认证
│   │   │   └── teamRole.ts # 团队角色权限
│   │   ├── services/       # 业务逻辑
│   │   │   ├── generation-service.ts
│   │   │   ├── image-service.ts
│   │   │   ├── user-service.ts
│   │   │   └── ...
│   │   └── index.ts        # 入口文件
│   └── wrangler.toml       # Workers 配置
│
├── frontend/               # Astro 前端
│   ├── src/
│   │   ├── pages/          # 页面路由
│   │   │   ├── index.astro     # 首页
│   │   │   ├── generate.astro  # 生成页面
│   │   │   ├── history.astro   # 历史页面
│   │   │   ├── favorites.astro # 收藏页面
│   │   │   ├── stats.astro     # 统计页面
│   │   │   ├── compare.astro   # 对比页面
│   │   │   ├── api-keys.astro  # API 密钥页面
│   │   │   ├── teams.astro     # 团队页面
│   │   │   └── ...
│   │   ├── components/     # React 组件
│   │   │   ├── GeneratePage.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   ├── FavoritesPage.tsx
│   │   │   ├── StatsPage.tsx
│   │   │   ├── CompareView.tsx
│   │   │   ├── ImageEditor.tsx
│   │   │   └── ...
│   │   ├── layouts/        # 布局组件
│   │   │   └── Layout.astro
│   │   ├── lib/            # 工具函数
│   │   │   ├── api.ts      # API 调用
│   │   │   └── ...
│   │   └── styles/         # 样式
│   │       └── global.css
│   └── astro.config.mjs    # Astro 配置
│
├── packages/               # 共享包
│   ├── database/           # 数据库 schema
│   │   └── src/
│   │       └── schema.ts
│   ├── types/              # TypeScript 类型
│   │   └── src/
│   │       └── index.ts
│   └── config/             # 共享配置
│       └── src/
│           └── index.ts
│
├── drizzle/                # 数据库迁移
│   └── migrations/
│
├── docs/                   # 文档
│   ├── PRODUCT.md          # 产品文档
│   ├── DEVELOPMENT.md      # 开发文档（本文件）
│   └── API.md              # API 文档
│
├── CLAUDE.md               # Claude Code 配置
├── README.md               # 项目说明
├── package.json            # 项目依赖
├── pnpm-workspace.yaml     # pnpm 工作区配置
├── turbo.json              # Turborepo 配置
└── wrangler.toml           # Cloudflare 配置
```

## 本地开发

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Cloudflare 账号（用于 D1、R2、Workers）
- Google Gemini API Key
- Stripe 账号（可选，用于支付功能）

### 安装步骤

1. **克隆仓库**

```bash
git clone https://github.com/redisread/oura-pix.git
cd oura-pix
```

2. **安装依赖**

```bash
pnpm install
```

3. **初始化 Cloudflare 资源**

```bash
# 登录 Cloudflare
npx wrangler login

# 创建 D1 数据库
pnpm run cf:init

# 或手动创建
npx wrangler d1 create oura-pix-db
npx wrangler r2 bucket create oura-pix-images
```

4. **配置环境变量**

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local，配置以下密钥：
# - GEMINI_API_KEY：Google Gemini API Key
# - STRIPE_SECRET_KEY：Stripe Secret Key（可选）
# - AUTH_SECRET：认证密钥（可用 openssl rand -base64 32 生成）
```

5. **运行数据库迁移**

```bash
pnpm run db:migrate
```

6. **启动开发服务器**

```bash
pnpm run dev
```

访问 [http://localhost:4001](http://localhost:4001)

### 开发命令

```bash
# 启动开发服务器（前端 + API）
pnpm run dev

# 只启动前端
pnpm --filter frontend dev

# 只启动 API
pnpm --filter api dev

# 运行类型检查
pnpm run typecheck

# 运行 lint
pnpm run lint

# 运行测试
pnpm run test

# 构建生产版本
pnpm run build
```

## 数据库

### Schema 定义

数据库 schema 定义在 `packages/database/src/schema.ts`，使用 Drizzle ORM。

### 主要表

- `users`：用户表
- `sessions`：会话表
- `generations`：生成任务表
- `images`：图片表
- `favorites`：收藏表
- `notifications`：通知表
- `metrics`：性能指标表
- `errors`：错误追踪表
- `api_keys`：API 密钥表
- `teams`：团队表
- `team_members`：团队成员表

### 迁移

```bash
# 生成迁移
pnpm run db:generate

# 运行迁移（开发环境）
pnpm run db:migrate

# 运行迁移（生产环境）
pnpm run db:migrate:prod
```

## API 开发

### 路由结构

API 路由使用 Hono 框架，定义在 `api/src/routes/` 目录。

### 添加新路由

1. 在 `api/src/routes/` 创建新文件
2. 定义路由和处理函数
3. 在 `api/src/index.ts` 注册路由

示例：

```typescript
// api/src/routes/example.ts
import { Hono } from 'hono';
import { getUser } from '../middleware/auth';

const router = new Hono();

router.get('/', async (c) => {
  const user = getUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  return c.json({ message: 'Hello' });
});

export default router;
```

```typescript
// api/src/index.ts
import exampleRoutes from './routes/example';

app.route('/api/example', exampleRoutes);
```

### 中间件

- `auth.ts`：用户认证中间件
- `apiKeyAuth.ts`：API Key 认证中间件
- `teamRole.ts`：团队角色权限中间件

## 前端开发

### 页面结构

页面使用 Astro 框架，定义在 `frontend/src/pages/` 目录。

### 组件开发

组件使用 React，定义在 `frontend/src/components/` 目录。

### 状态管理

使用 Zustand 进行状态管理，定义在组件内部或 `frontend/src/lib/` 目录。

### 国际化

使用 paraglide-js 进行国际化，翻译文件在 `frontend/src/messages/` 目录。

```bash
# 添加新的翻译 key
# 编辑 frontend/src/messages/en.json, zh.json, ja.json
```

## 部署

### 生产环境部署

```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 创建生产资源
npx wrangler d1 create oura-pix-db
npx wrangler r2 bucket create oura-pix-images

# 3. 配置生产密钥
npx wrangler pages secret put AUTH_SECRET
npx wrangler pages secret put STRIPE_SECRET_KEY
npx wrangler pages secret put GEMINI_API_KEY

# 4. 应用数据库迁移
pnpm run db:migrate:prod

# 5. 部署到生产
pnpm run deploy
```

### 部署流程

1. 合并 PR 到 main 分支
2. GitHub Actions 自动运行 CI/CD
3. 自动部署到 Cloudflare Pages 和 Workers

### 环境变量

生产环境变量在 Cloudflare Dashboard 配置：

- `AUTH_SECRET`：认证密钥
- `GEMINI_API_KEY`：Gemini API Key
- `STRIPE_SECRET_KEY`：Stripe Secret Key
- `DATABASE_URL`：D1 数据库连接
- `R2_BUCKET`：R2 存储桶名称

## 代码规范

### TypeScript

- 严格模式
- 使用类型推断
- 避免 `any` 类型
- 使用 interface 定义对象类型

### React

- 使用函数组件
- 使用 hooks 管理状态
- 组件命名使用 PascalCase
- 文件命名使用 PascalCase（组件）或 camelCase（工具）

### CSS

- 使用 Tailwind CSS
- 避免自定义 CSS
- 使用 Shadcn UI 组件

### Git

- 提交信息使用 Conventional Commits
- 分支命名：`feat/xxx`、`fix/xxx`、`docs/xxx`
- PR 标题遵循提交信息规范

## 贡献指南

### 提交流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/xxx`
3. 提交更改：`git commit -m 'feat: add xxx'`
4. 推送分支：`git push origin feat/xxx`
5. 提交 Pull Request

### Code Review

- 所有 PR 需要至少 1 个 approval
- CI 检查必须通过
- 代码需要符合代码规范

### 测试

- 新功能需要添加测试
- 修复 bug 需要添加回归测试
- 测试覆盖率要求 > 80%

## 常见问题

### Q: 如何调试 API？

A: 使用 `wrangler dev` 启动本地开发服务器，可以使用 Postman 或 curl 调试。

### Q: 如何查看数据库内容？

A: 使用 `wrangler d1 execute` 命令或 Cloudflare Dashboard。

### Q: 如何部署到预览环境？

A: 推送分支后，Cloudflare Pages 会自动创建预览部署。

### Q: 如何处理数据库迁移冲突？

A: 使用 `pnpm run db:generate` 重新生成迁移，然后手动合并。

## 相关资源

- [Astro 文档](https://docs.astro.build/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [Hono 文档](https://hono.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Shadcn UI 文档](https://ui.shadcn.com/)
