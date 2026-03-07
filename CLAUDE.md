
## 开发参考

遵守使用 OpenNext 的最佳实践，可以参考 ：
- https://opennext.js.org/cloudflare/get-started
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

Cloudflare 适配器提供了一个 opennextjs-cloudflare 命令行界面 (CLI)，用于开发、构建和部署应用程序。除非另有文档说明或您清楚自己在做什么，否则不应直接使用 wrangler 命令。可以参考 https://opennext.js.org/cloudflare/cli


## 项目迭代规范
- 发现优化点可以记录在 TODO.md 文件中
- 需要实现的功能可以记录在 TODO.md 文件中
- 完成 TODO.md 的某个待办，需要标记对应的待办为完成,并且将完成的事项移动到FINISH.md中

## 多语言适配规范
- 所有用户可见的文案必须进行多语言适配
- 新增或修改文案时，同步更新多语言资源文件
- 使用 I18n 工具类获取多语言文案，禁止硬编码
- 多语言 key 命名规范：`模块名.功能名.具体文案标识`
- 英文文案作为默认语言，其他语言跟随翻译

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
# 使用 Wrangler 本地模式启动开发服务器
npx wrangler dev --local

# 或使用 opennextjs-cloudflare 的本地模式
npx opennextjs-cloudflare dev --local
```

#### 组件访问方式

| 组件 | 本地访问方式 | 说明 |
|------|-------------|------|
| **D1 数据库** | `env.DB` | 使用 Wrangler 本地 D1 模拟 |
| **R2 存储** | `env.R2` | 使用 Wrangler 本地 R2 模拟 |
| **KV 存储** | `env.KV` | 使用 Wrangler 本地 KV 模拟 |

#### 配置要求

1. **wrangler.toml** 需配置本地绑定的组件：

```toml
[[d1_databases]]
binding = "DB"
database_name = "oura-pix-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "R2"
bucket_name = "oura-pix-images"
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
- 不要在本地上产环境配置 `.dev.vars` 文件，该文件已被添加到 `.gitignore`
