# OuraPix 重构方案

## 目标

参考 gomate 项目架构，重构 oura-pix，实现：
1. 代码结构清晰化
2. 无用代码清理
3. 开发规范统一
4. 技术栈优化

---

## 1. 架构对比分析

### gomate 架构优势

```
gomate/
├── api/                 # Hono + Cloudflare Workers
├── frontend/           # Astro + React + Tailwind
├── packages/
│   ├── types/         # 共享类型
│   └── config/        # 共享配置
├── CLAUDE.md          # 完整的开发文档
└── pnpm-workspace.yaml
```

**核心特点：**
- 扁平目录结构，职责清晰
- 完善的 CLAUDE.md 开发文档
- 中文文案集中管理 (copy.ts)
- 统一的技术栈和命名规范
- 前后端分离彻底

### oura-pix 当前架构

```
oura-pix/
├── apps/
│   ├── api/           # Hono + Cloudflare Workers
│   └── web/           # Next.js + Cloudflare
├── packages/
│   ├── database/      # Drizzle schema
│   └── api-client/    # HTTP client
├── lib/               # 根目录遗留代码
├── app/               # 遗留代码（已清理）
├── components/        # 遗留代码（已清理）
└── TODO.md            # 任务清单
```

**主要问题：**
1. Next.js 而非 Astro，边缘运行时兼容性复杂
2. 缺少 CLAUDE.md 级别的开发文档
3. 技术栈混杂（Next.js + Hono）
4. 前端架构不一致
5. 文案分散，无统一管理

---

## 2. 重构方案

### Phase 1: 目录结构重构

**目标：** 对齐 gomate 风格，扁平化目录

```
oura-pix/
├── api/                    # Hono + Cloudflare Workers (从 apps/api 迁移)
├── frontend/               # Astro + React + Tailwind (替换 apps/web)
├── packages/
│   ├── types/             # 共享类型 (@oura-pix/types)
│   └── config/            # 共享 tsconfig (@oura-pix/config)
├── CLAUDE.md              # 新建 - 开发文档
├── docs/                  # 架构文档
│   ├── architecture.md
│   ├── api-reference.md
│   └── deployment.md
├── scripts/               # 构建脚本
├── package.json
└── pnpm-workspace.yaml
```

**具体改动：**
1. `apps/api` → `api/`
2. `apps/web` → `frontend/` (技术栈从 Next.js 迁到 Astro)
3. `packages/database` 合并到 `packages/types`
4. `packages/api-client` 保留，移至 `packages/api-client`

### Phase 2: 技术栈统一

**前端：Next.js → Astro**

| 维度 | Next.js | Astro |
|------|---------|-------|
| 边缘运行时 | 复杂配置 | 原生支持 Cloudflare |
|  islands 架构 | 不支持 | 原生支持 |
| 部分水合 | 复杂 | 简单 (client:load) |
| 与 Hono 配合 | API Routes 冲突 | 完全分离 |

**迁移内容：**
1. `app/` 路由 → `src/pages/` 路由
2. `page.tsx` → `page.astro` + React Islands
3. `layout.tsx` → `Layout.astro`
4. Server Actions → API 调用

**文案管理：**
新建 `frontend/src/lib/copy.ts`，集中管理所有用户可见文案（参考 gomate）

### Phase 3: 无用代码清理

**已清理（2026-04-05）：**
- ✅ 根目录 `app/`, `components/`, `hooks/`
- ✅ 废弃 lib 文件
- ✅ 旧配置文件

**待清理：**
1. `lib/` 根目录遗留（检查是否在用）
2. `content/` 目录（博客内容，项目相关？）
3. 重复的脚本文件
4. 未使用的依赖

### Phase 4: 开发规范建立

**新建 CLAUDE.md（参考 gomate）：**

```markdown
# CLAUDE.md

## 项目概述
OuraPix - AI 驱动的跨境电商商品详情页生成器

## 项目架构（pnpm Monorepo）
```
oura-pix/
├── api/          # Hono + Cloudflare Workers
├── frontend/     # Astro + React + Tailwind
├── packages/
│   ├── types/   # 共享类型
│   └── config/  # 共享配置
```

## 技术栈
### 后端
- Hono + Cloudflare Workers
- Drizzle ORM + D1
- Better Auth
- R2 存储

### 前端
- Astro 4 (SSR + Cloudflare 适配器)
- React 18 + Tailwind CSS 4 + shadcn/ui
- Zustand 状态管理

## 开发命令
pnpm dev           # 同时启动
pnpm api:dev       # localhost:8799
pnpm web:dev       # localhost:4321

## 关键约定
- 组件命名：PascalCase
- 文案管理：frontend/src/lib/copy.ts
- API 基地址：环境变量 PUBLIC_API_URL
```

**Git 规范：**
```
feat: 新功能
fix: 修复
docs: 文档
refactor: 重构
test: 测试
chore: 构建/工具
```

### Phase 5: 功能代码迁移

**需迁移的核心功能：**
1. 认证系统（Better Auth）
2. Imagen 3 图片生成
3. Stripe 支付
4. 项目管理
5. 用户设置

**迁移顺序：**
1. 基础布局 + 认证
2. Dashboard + 项目管理
3. 图片生成功能
4. 支付集成
5. 设置页面

---

## 3. 任务拆分

### 阶段 1: 基础设施（基础）
| 任务 | 负责人 | 预估 |
|------|--------|------|
| 1.1 创建重构分支 `refactor/gomate-style` | @Martin | - |
| 1.2 迁移 `apps/api` → `api/` | @待定 | 2h |
| 1.3 新建 `frontend/` Astro 项目 | @待定 | 4h |
| 1.4 配置 `packages/types` 和 `packages/config` | @待定 | 2h |
| 1.5 更新根目录 package.json + pnpm-workspace | @待定 | 1h |
| 1.6 创建 CLAUDE.md | @Martin | 2h |

### 阶段 2: 前端迁移（核心）
| 任务 | 负责人 | 预估 |
|------|--------|------|
| 2.1 迁移布局组件（Layout, Navbar, Footer） | @待定 | 4h |
| 2.2 迁移认证页面（Login, Register） | @待定 | 4h |
| 2.3 迁移 Dashboard + 项目管理 | @待定 | 6h |
| 2.4 迁移图片生成页面 | @待定 | 6h |
| 2.5 迁移支付相关页面 | @待定 | 4h |
| 2.6 迁移设置页面 | @待定 | 3h |
| 2.7 创建 copy.ts 文案管理 | @待定 | 2h |

### 阶段 3: 代码清理（并行）
| 任务 | 负责人 | 预估 |
|------|--------|------|
| 3.1 清理根目录 `lib/` 遗留代码 | @待定 | 2h |
| 3.2 删除 `apps/` 旧目录 | @待定 | 1h |
| 3.3 清理未使用依赖 | @待定 | 1h |
| 3.4 验证构建和部署 | @待定 | 2h |

### 阶段 4: 测试验证
| 任务 | 负责人 | 预估 |
|------|--------|------|
| 4.1 本地开发环境验证 | @待定 | 2h |
| 4.2 功能回归测试 | @待定 | 4h |
| 4.3 部署到测试环境 | @待定 | 2h |
| 4.4 性能测试 | @待定 | 2h |

---

## 4. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Next.js → Astro 功能丢失 | 高 | 逐项迁移，对照测试 |
| Imagen 3 功能中断 | 高 | 保持 API 不变，只改前端调用 |
| 部署配置失效 | 中 | 同步更新 wrangler.toml |
| 依赖冲突 | 中 | 使用 pnpm overrides |

---

## 5. 时间安排

**总预估：40-50 工时**

**并行策略：**
- 阶段 1 和阶段 3 可部分并行
- 阶段 2 需要按页面顺序执行
- 建议 2-3 人并行开发

**建议团队：**
- 1 人：基础设施 + Astro 专家
- 1 人：前端页面迁移
- 1 人：代码清理 + 测试

---

## 6. 验收标准

1. ✅ 目录结构符合方案设计
2. ✅ `pnpm dev` 正常启动前后端
3. ✅ `pnpm build` 无错误
4. ✅ 核心功能（认证、生成、支付）正常
5. ✅ CLAUDE.md 完整可用
6. ✅ 根目录无遗留代码
7. ✅ 部署到 Cloudflare 成功

---

*方案设计完成，等待团队安排后执行。*
