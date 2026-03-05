
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
