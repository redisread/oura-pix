# OuraPix

## 项目概述

OuraPix - AI 驱动的跨境电商商品详情页生成器

技术重构中，目标架构参考 gomate 项目。

## 项目架构（pnpm Monorepo）

```
oura-pix/
├── api/                    # Hono + Cloudflare Workers
├── frontend/               # Astro + React + Tailwind
│   ├── src/
│   │   ├── pages/       # Astro 页面
│   │   ├── components/  # React 组件
│   │   ├── layouts/     # 布局组件
│   │   └── paraglide/   # i18n 翻译（自动生成）
│   ├── messages/        # 翻译源文件
│   └── project.inlang.json
├── packages/
│   ├── types/          # 共享类型
│   └── config/         # 共享配置
├── CLAUDE.md           # 本文件
└── pnpm-workspace.yaml
```

## 技术栈

### 后端 (api/)
- Hono + Cloudflare Workers
- Drizzle ORM + D1
- Better Auth
- R2 存储

### 前端 (frontend/)
- Astro 5 (SSR + Cloudflare 适配器)
- React 18 + Tailwind CSS + shadcn/ui
- Zustand 状态管理
- paraglide-js i18n（类型安全 + tree-shaking）

## 开发命令

```bash
# 根目录
pnpm dev           # 同时启动 api + frontend
pnpm api:dev       # localhost:8989
pnpm web:dev       # localhost:4321

# API 目录
cd api/
pnpm dev           # wrangler dev

# Frontend 目录
cd frontend/
pnpm dev           # astro dev
```

## i18n 国际化

使用 paraglide-js，类型安全，仅打包使用的翻译。

### 添加翻译

1. 编辑 `messages/{locale}.json`
2. 运行生成命令

```bash
cd frontend
npx @inlang/paraglide-js compile --project ./project.inlang.json --outdir ./src/paraglide
```

### 使用翻译

```typescript
import * as m from "@/paraglide/messages"

// 类型安全，IDE 智能提示
m.welcome()        // 自动推断返回 string
m.description()    // 未翻译的 key 会报错
```

## 关键约定

- **组件命名**：PascalCase
- **页面命名**：小写 + 连字符（kebab-case）
- **文案管理**：`messages/*.json` + paraglide
- **API 基地址**：环境变量 `PUBLIC_API_URL`

## Git 规范

```
feat:    新功能
fix:     修复
docs:    文档
refactor: 重构
test:    测试
chore:   构建/工具
```

## 重构状态

| 阶段 | 状态 | 负责人 |
|------|------|--------|
| Phase 1 | ✅ 完成 | @Jeff |
| Phase 2 | ⏳ 进行中 | @Alex |
| Phase 3 | ⏳ 等待 | @Wen |
| Phase 4 | ⏳ 等待 | @Wen |
