
## 开发参考

- 官方文档：https://opennext.js.org/cloudflare/get-started
- Cloudflare Next.js 指南：https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- CLI 文档：https://opennext.js.org/cloudflare/cli


## OpenNext Cloudflare 核心规范

### 1. 核心设置要求

#### Package 安装
```bash
# 核心适配器（必需）
npm install @opennextjs/cloudflare@latest

# Wrangler CLI（开发依赖，版本 3.99.0+）
npm install -D wrangler@latest
```

#### 配置文件

**wrangler.jsonc** - Worker 配置文件：
```jsonc
{
  "name": "your-worker-name",
  "main": ".open-next/worker.js",
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  // 其他绑定配置（D1, R2, KV 等）
  "d1_databases": [...],
  "r2_buckets": [...]
}
```

**open-next.config.ts** - OpenNext 适配器配置：
```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Cloudflare 特定配置
});
```

**.dev.vars** - 本地开发环境变量：
```bash
NEXTJS_ENV=development
# 其他本地 Secrets
```

### 2. 项目结构规范

#### 构建输出目录
- `.open-next/` - 构建生成的目录，包含：
  - `worker.js` - 主 Worker 脚本
  - `assets/` - 静态资源文件

#### 版本控制
- **必须**将 `.open-next/` 添加到 `.gitignore`
- 不提交构建产物到代码仓库

### 3. 开发工作流程

#### 可用命令（package.json scripts）
```json
{
  "scripts": {
    "build": "next build",
    "preview": "opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare deploy",
    "upload": "opennextjs-cloudflare upload"
  }
}
```

#### 命令说明
| 命令 | 作用 |
|------|------|
| `build` | 构建 Next.js 应用 |
| `preview` | 本地预览（使用 Workers 运行时） |
| `deploy` | 构建并部署到生产环境 |
| `upload` | 构建并上传版本（不立即部署） |

#### 开发规范
1. **日常开发**：继续使用 `next dev` 进行本地开发
2. **Worker 环境测试**：使用 `npm run preview` 在真实 Workers 运行时测试
3. **生产部署**：使用 `npm run deploy` 部署到 Cloudflare

### 4. 运行时限制与最佳实践

#### ❌ 禁止事项
- **禁止使用** `export const runtime = "edge"` - Edge Runtime 不受支持
- **禁止直接使用 wrangler 命令** - 除非明确文档说明
- **禁止混用** `@cloudflare/next-on-pages` - 已替换为 `@opennextjs/cloudflare`

#### ✅ 推荐做法
- 使用 `opennextjs-cloudflare` CLI 进行所有构建/部署操作
- 在 next.config.js 中导入 `initOpenNextCloudflareForDev` 工具
- 本地开发使用 `.dev.vars` 管理环境变量

### 5. 缓存策略

#### 静态资源缓存
创建 `public/_headers` 文件配置缓存：
```
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable
```

#### 增量缓存（ISR）
- 配置 R2 bucket 绑定用于增量缓存支持
- 在 `wrangler.jsonc` 中配置 R2 绑定


## 环境变量使用规范

### 获取方式

| 变量类型 | 获取方式 | 示例 |
|---------|---------|------|
| **客户端变量** | `process.env.NEXT_PUBLIC_XXX` | `process.env.NEXT_PUBLIC_APP_URL` |
| **服务端变量** | `getCloudflareContext().env.XXX` | `env.BETTER_AUTH_SECRET` |

### 具体说明

**客户端变量 (使用 `NEXT_PUBLIC_` 前缀)：**
- `NEXT_PUBLIC_APP_URL` - 应用基础 URL
- 这些变量会被打包到客户端代码中，可在客户端和服务端访问
- 环境判断 `process.env.NODE_ENV` 也使用此方式

**服务端变量 (使用 `getCloudflareContext().env`)：**
- Cloudflare 绑定：`DB` (D1), `R2` (存储)
- Secrets：`BETTER_AUTH_SECRET`, `STRIPE_SECRET_KEY`, `GEMINI_API_KEY`, `RESEND_API_KEY` 等
- 配置变量：`FROM_EMAIL`, `CLOUDFLARE_R2_PUBLIC_URL` 等

### 代码示例

```typescript
// ✅ 正确：服务端获取运行时变量
import { getCloudflareContext } from '@/lib/cloudflare-context';

export async function someFunction() {
  const { env } = await getCloudflareContext();
  const secret = env.BETTER_AUTH_SECRET;
  const db = env.DB;
}

// ✅ 正确：客户端获取公开变量
const appUrl = process.env.NEXT_PUBLIC_APP_URL;

// ❌ 错误：服务端直接使用 process.env 获取 Secrets
const secret = process.env.BETTER_AUTH_SECRET; // 这在 Cloudflare Workers 中不工作
```


## 本地测试规范

### Cloudflare 组件本地测试

本地测试时使用 Cloudflare D1 数据库、R2 存储等组件，需通过 Wrangler CLI 的 local 模式运行。

#### 启动命令

```bash
# 使用 opennextjs-cloudflare 本地预览
npm run preview

# 或使用 wrangler 本地模式
npx wrangler dev --local
```

#### 组件访问方式

| 组件 | 本地访问方式 | 说明 |
|------|-------------|------|
| **D1 数据库** | `env.DB` | 使用 Wrangler 本地 D1 模拟 |
| **R2 存储** | `env.R2` | 使用 Wrangler 本地 R2 模拟 |
| **KV 存储** | `env.KV` | 使用 Wrangler 本地 KV 模拟 |

#### 配置要求

1. **wrangler.jsonc** 需配置本地绑定的组件：

```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "oura-pix-db",
      "database_id": "your-database-id"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2",
      "bucket_name": "oura-pix-images"
    }
  ]
}
```

2. **本地环境变量文件** `.dev.vars`：

```bash
# 本地测试用的 Secrets
BETTER_AUTH_SECRET=your-local-secret
GEMINI_API_KEY=your-local-api-key
```

#### 代码示例

```typescript
// ✅ 正确：本地测试时统一使用 getCloudflareContext
import { getCloudflareContext } from '@/lib/cloudflare-context';

export async function testFunction() {
  const { env } = await getCloudflareContext();

  // 访问 D1 数据库
  const result = await env.DB.prepare('SELECT * FROM users').all();

  // 访问 R2 存储
  const object = await env.R2.get('image-key');
}
```

#### 注意事项

- 本地测试时 D1 使用 SQLite 本地文件存储，位于 `.wrangler/state/v3/d1/`
- 本地测试时 R2 使用本地文件系统模拟，位于 `.wrangler/state/v3/r2/`
- 首次运行前需执行数据库迁移：`npx wrangler d1 migrations apply DB --local`
- 不要在本地提交生产环境配置 `.dev.vars` 文件，该文件已被添加到 `.gitignore`


## 多语言适配规范

- 所有用户可见的文案必须进行多语言适配
- 新增或修改文案时，同步更新多语言资源文件
- 使用 I18n 工具类获取多语言文案，禁止硬编码
- 多语言 key 命名规范：`模块名.功能名.具体文案标识`
- 英文文案作为默认语言，其他语言跟随翻译


## 项目迭代规范

- 发现优化点可以记录在 TODO.md 文件中
- 需要实现的功能可以记录在 TODO.md 文件中
- 完成 TODO.md 的某个待办，需要标记对应的待办为完成，并且将完成的事项移动到 FINISH.md 中
