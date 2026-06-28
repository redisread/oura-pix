# OuraPix Agent 规则

## 项目定位

OuraPix 是面向跨境电商卖家的 AI 商品详情页生成器。当前仓库是 Cloudflare 原生部署的 pnpm/turbo monorepo。

主要边界：

- `api/`：Hono + Cloudflare Workers API，集成 Better Auth、Drizzle ORM、D1、R2、Gemini、Stripe 和 Resend。
- `frontend/`：Astro 5 + React 18 前端，使用 Tailwind CSS 4、Zustand 和 Cloudflare adapter。
- `packages/api-client/`：前端访问 API 的主要边界。
- `packages/database/`：Drizzle schema 和数据库迁移命令。
- `packages/config/`、`packages/types/`、`packages/i18n/`：共享配置、类型和国际化能力。
- `drizzle/migrations/`：当前 D1 迁移源；`api/wrangler.jsonc` 指向该目录。

不要依赖旧架构描述做判断。遇到冲突时，以当前代码、`package.json`、`api/wrangler.jsonc`、`frontend/wrangler.toml` 和实际命令结果为准。

## 思维原则

- 所有决策从问题本质出发。先判断要解决什么问题，再选择最直接、风险最低的路径。
- 不要谄媚。方案有问题直接指出；发现更简单或更稳的做法直接采用并说明原因。
- 能小改解决的问题不要大改。确实需要重构时，先定义边界、风险、回滚方式和验收标准。
- 不要因为“惯例如此”照搬模式。优先服从当前仓库的真实结构、运行约束和用户明确范围。
- 用户限定范围时必须收紧改动边界；不要顺手改无关文件、依赖、格式或文案。

## 会话启动与技能

- 会话开始时，默认加载 [$using-agent-skills](.agents/skills/using-agent-skills/SKILL.md) 技能，并用它判断当前任务还需要哪些技能。
- 如果用户明确点名某个技能，先读取对应 `SKILL.md`，再执行后续操作。

## 常用命令

基础命令：

```bash
pnpm install
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm verify
pnpm debug:check
pnpm debug:full
```

API：

```bash
pnpm api:dev
pnpm api:deploy
pnpm --filter=@oura-pix/api lint
pnpm --filter=@oura-pix/api typecheck
pnpm --filter=@oura-pix/api test
```

Frontend：

```bash
pnpm web:dev
pnpm web:preview
pnpm web:deploy
pnpm --filter=@oura-pix/frontend build
pnpm --filter=@oura-pix/frontend lint
pnpm --filter=@oura-pix/frontend typecheck
```

Database：

```bash
pnpm db:generate
pnpm db:migrate:local
pnpm db:migrate:prod
pnpm db:studio
```

## 开发约束

- Node.js 版本遵循根目录 `package.json` 的 `engines.node`：`>=18.0.0`。
- 包管理器遵循根目录 `packageManager`：`pnpm@9.0.0`。
- 前端请求应经过 `frontend/src/lib/api.ts`，确保 `PUBLIC_API_URL` 生效。
- `/api/v1/*` 使用 API Key 认证；`/api/webhooks/stripe` 使用 Stripe 签名认证；不要把这些入口放到 session auth 后面。
- 生产数据库迁移、部署、Cloudflare 外部状态变更必须有人类明确授权。
- 不要提交或粘贴 secrets，包括 Gemini、Stripe、OAuth、Better Auth、Cloudflare、Resend 相关密钥。
- 本地环境文件只用于本机开发，例如 `api/.dev.vars` 和 `frontend/.env.local`，不要提交。
- 生成迁移前先确认 schema 变更确实需要迁移；不要保留会重建既有表的 catch-up migration。
- i18n 文案大改前先核实 `frontend/messages/` 和当前 Paraglide 生成流程。
- 新增依赖前必须说明必要性、替代方案和影响范围。

## 验收与交付

按变更范围选择验证命令：

- 只改 API：至少运行 `pnpm --filter=@oura-pix/api lint` 和 `pnpm --filter=@oura-pix/api test`；涉及类型边界时加 `pnpm --filter=@oura-pix/api typecheck`。
- 只改前端：至少运行 `pnpm --filter=@oura-pix/frontend build` 和 `pnpm --filter=@oura-pix/frontend lint`；涉及类型边界时加 `pnpm --filter=@oura-pix/frontend typecheck`。
- 跨包或共享类型变更：运行 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`，或直接运行 `pnpm verify`。
- 只改文档或规则文件：至少做内容走读和 `git diff --check`；不需要运行业务构建，除非文档生成链路被修改。

交付说明必须包含：

- 改动范围和涉及 package。
- 实际运行的命令及结果。
- 是否触碰 Cloudflare 资源。
- 是否影响数据库迁移。
- 回滚方式或恢复路径。

## Git 与评审

- 开始前查看 `git status --short --branch -uall`，不要覆盖用户已有改动。
- 每次改动保持一个清晰目的；不要混合格式化、重构和功能变更。
- 提交信息使用中文描述改动，除非用户另有要求。
- 创建 PR 前确认目标分支真实存在，特别是用户指定 `master`、`main` 或内部发布分支时。
- 创建 PR 后必须对 PR 进行 CR 和 CI 检查；失败时先通知用户，再修复问题并重复检查，直到通过或明确阻塞。
- 评审输出使用中文，优先列真实 bug、回归风险、缺失测试和可复现证据。
- 合并、推送、部署、迁移前必须重新核对当前本地和远端状态。

## 文档与图表

- Mermaid 图表默认使用 Hand-Drawn 涂鸦风格，在代码块第一行写：

```mermaid
%%{init: {"look": "handDrawn", "theme": "neutral"}}%%
```

- 不要只依赖 Mermaid frontmatter 的 `config.look`，避免渲染器不兼容时退回普通样式。
- 产品说明、API reference、长示例应放到 `docs/`，不要把根目录规则文件写成大而全的说明书。
- 规则文件用于约束 Agent 行为；如果规则与当前代码冲突，先核实现状，再更新规则或说明冲突。
