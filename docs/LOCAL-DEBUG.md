# 本地调试方案（支持 Cloudflare 特性）

## 概述

本文档介绍如何在本地调试 OuraPix 项目，完整支持 Cloudflare 特性（D1 数据库、R2 存储等）。

## 架构说明

本项目采用 monorepo 结构：

```
apps/
├── api/          # Cloudflare Worker (Hono)
└── web/          # Next.js + OpenNext Cloudflare
packages/
└── database/     # Drizzle ORM + D1 数据库
```

## 调试模式选择

### 模式一：API Worker 独立调试（推荐用于 API 开发）

仅调试后端 API，不依赖前端。

```bash
# 终端 1: 启动 API Worker（本地模式，带 D1/R2 支持）
cd apps/api
pnpm dev

# 或使用 wrangler 直接启动（等价）
wrangler dev --local
```

API 将在 `http://localhost:8787` 运行。

### 模式二：Web 独立调试（推荐用于前端开发）

仅调试前端，API 使用远程或 mock。

```bash
# 终端 1: 启动 Next.js 开发服务器
cd apps/web
pnpm dev

# 或使用 turbo
pnpm dev:web
```

Web 将在 `http://localhost:4001` 运行。

### 模式三：联合调试（推荐用于全栈开发）

同时调试 API 和 Web，支持完整的 Cloudflare 特性。

```bash
# 步骤 1: 确保 D1 数据库已迁移
pnpm db:migrate:local

# 步骤 2: 启动 API Worker
cd apps/api
pnpm dev

# 步骤 3: 在另一个终端启动 Web（使用 turbo）
pnpm dev:web
```

### 模式四：Web 真实 Workers 运行时调试（推荐用于部署前验证）

使用 OpenNext 的 preview 模式，在真实 Workers 运行时中调试 Web 应用。

```bash
cd apps/web

# 构建并启动预览（使用本地 Wrangler 模拟）
pnpm preview

# 或使用 turbo
pnpm preview:web
```

## 环境变量配置

### 1. API Worker (.dev.vars)

文件路径：`apps/api/.dev.vars`

```bash
# Better Auth Secret
BETTER_AUTH_SECRET=local-dev-secret-key-change-in-production

# Stripe (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# AI Service
GEMINI_API_KEY=your_gemini_api_key

# Email Service
RESEND_API_KEY=re_your_resend_api_key

# OAuth (可选，用于测试登录)
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_client_secret
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_client_secret
```

### 2. Web 应用 (.env.local)

文件路径：`apps/web/.env.local`

```bash
# API 地址（指向本地 Worker）
NEXT_PUBLIC_API_URL=http://localhost:8787

# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:4001

# Stripe Publishable Key (Test)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

**注意**：`.dev.vars` 和 `.env.local` 已添加到 `.gitignore`，不会提交到仓库。

## D1 数据库本地调试

### 初始化数据库

```bash
# 首次使用或 schema 变更后执行
pnpm db:migrate:local

# 或使用 wrangler 直接操作
cd packages/database
wrangler d1 migrations apply oura-pix-db --local
```

### 数据库文件位置

本地 D1 数据库文件存储在：

```
.wrangler/state/v3/d1/
└── miniflare-D1DatabaseObject/
    └── xxxxxx.sqlite3
```

**提示**：如果数据库状态异常，可以删除此目录重新初始化。

### 使用 Drizzle Studio 可视化数据库

```bash
# 启动 Drizzle Studio
pnpm db:studio

# 或使用 turbo
pnpm turbo run db:studio
```

访问 `https://local.drizzle.studio` 查看和编辑数据。

### 手动执行 SQL

```bash
# 使用 wrangler SQL 命令
cd apps/api
wrangler d1 execute oura-pix-db --local --command="SELECT * FROM users"

# 或从文件执行
wrangler d1 execute oura-pix-db --local --file=./scripts/test.sql
```

## R2 存储本地调试

### R2 本地存储位置

本地 R2 存储模拟使用文件系统：

```
.wrangler/state/v3/r2/
└── oura-pix-r2/
    └── bucket/
        └── your-file-key
```

### 测试 R2 上传

```bash
# 使用 wrangler r2 命令
cd apps/api
wrangler r2 object put oura-pix-r2/test/image.png --file=./test-image.png --local

# 列出对象
wrangler r2 object list oura-pix-r2 --local

# 获取对象
wrangler r2 object get oura-pix-r2/test/image.png --local
```

## VS Code 调试配置

### 1. 创建 launch.json

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug: API Worker",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "cwd": "${workspaceFolder}/apps/api",
      "sourceMapPathOverrides": {
        "webpack://*": "${workspaceFolder}/apps/api/*"
      }
    },
    {
      "name": "Debug: Web (Next.js)",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/apps/web",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "serverReadyAction": {
        "pattern": "ready on (https?://.+)",
        "uriFormat": "%s",
        "action": "openExternally"
      }
    }
  ],
  "compounds": [
    {
      "name": "Debug: Full Stack",
      "configurations": ["Debug: API Worker", "Debug: Web (Next.js)"],
      "preLaunchTask": "npm: db:migrate:local",
      "stopAll": true
    }
  ]
}
```

### 2. 使用 Chrome DevTools 调试 Worker

Wrangler 默认在 `--local` 模式下启用 Inspector：

1. 启动 API Worker：`cd apps/api && pnpm dev`
2. 打开 Chrome，访问 `chrome://inspect`
3. 点击 "Configure"，添加 `localhost:9229`
4. 在 "Remote Target" 下找到 Worker，点击 "inspect"

## 调试技巧

### 1. 查看 Cloudflare 绑定

在代码中使用 `getCloudflareContext` 获取绑定：

```typescript
import { getCloudflareContext } from '@/lib/cloudflare-context';

export async function debugBindings() {
  const { env } = await getCloudflareContext();

  console.log('D1 Database:', env.DB);
  console.log('R2 Bucket:', env.R2);
  console.log('Environment:', env.NODE_ENV);
}
```

### 2. 本地日志查看

Wrangler 本地模式会输出彩色日志：

```bash
# 查看详细日志
wrangler dev --local --log-level debug

# 仅查看错误
wrangler dev --local --log-level error
```

### 3. 热重载

- **API Worker**: 保存文件后自动重载
- **Web (Next.js)**: 保存文件后自动刷新
- **D1 Schema**: 需要重新运行迁移

### 4. 清理本地状态

如果本地状态异常：

```bash
# 删除所有本地状态
rm -rf .wrangler/state

# 重新初始化 D1
pnpm db:migrate:local
```

## 常见问题

### Q: D1 数据库连接失败？

**A**: 检查以下几点：
1. 是否运行了 `pnpm db:migrate:local`
2. `wrangler.jsonc` 中的 `database_id` 是否正确
3. 查看 `.wrangler/state/v3/d1/` 是否存在数据库文件

### Q: R2 上传失败？

**A**: 本地模式下 R2 使用文件系统模拟，确保：
1. `wrangler.jsonc` 中正确配置了 `r2_buckets`
2. 存储目录 `.wrangler/state/v3/r2/` 有写入权限

### Q: API 和 Web 端口冲突？

**A**: 默认端口：
- API Worker: 8787 (Wrangler 默认)
- Web: 4001 (package.json 中配置)

如需修改，在各自的 `wrangler.jsonc` 或 `package.json` 中调整。

### Q: 环境变量未生效？

**A**:
- API Worker 使用 `.dev.vars` 文件
- Web 使用 `.env.local` 文件
- 修改后需要重启服务

### Q: 如何模拟生产环境？

**A**: 使用 preview 模式：

```bash
cd apps/web
pnpm preview
```

这会在真实的 Workers 运行时中运行应用（本地模拟）。

## 脚本快捷方式

在根目录 `package.json` 中添加的快捷命令：

```bash
# 数据库
pnpm db:migrate:local     # 执行本地数据库迁移
pnpm db:studio            # 启动 Drizzle Studio

# API
pnpm api:dev              # 启动 API Worker
pnpm api:deploy           # 部署 API

# Web
pnpm web:dev              # 启动 Web 开发服务器
pnpm web:deploy           # 部署 Web

# 联合调试（使用 turbo）
pnpm dev                  # 同时启动 API 和 Web
```

## 最佳实践

1. **开发新功能时**：先使用 `pnpm api:dev` 单独调试 API，确认无误后再联调 Web
2. **数据库变更时**：及时运行 `pnpm db:migrate:local`，并在 `packages/database/migrations/` 中提交迁移文件
3. **调试 Secrets 时**：使用 `.dev.vars` 文件，永远不要提交真实密钥
4. **定期清理**：如果本地状态异常，删除 `.wrangler/state` 重新初始化
