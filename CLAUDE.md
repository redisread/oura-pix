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
| Phase 2 | ✅ 完成 | @Alex |
| Phase 3 | ✅ 完成 | @Jeff |
| Phase 4 | ✅ 完成 | @Wen |

**状态：全部完成 ✅**

---

## 本地测试步骤

### 1. 环境准备

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 添加必要配置
```

### 2. 构建测试

```bash
cd frontend
pnpm build
```

**预期结果：**
- ✓ built in ~2-5s
- ✓ Server built successfully
- ✓ Complete!

### 3. 开发服务器测试

```bash
# 根目录
pnpm dev

# 或分别启动
cd api && pnpm dev      # localhost:8989
cd frontend && pnpm dev  # localhost:4321
```

### 4. 页面功能检查清单

| 页面 | 路径 | 检查项 |
|------|------|--------|
| 首页 | `/` | 渲染正常、i18n 切换 |
| 登录 | `/login` | 表单显示、社交登录按钮 |
| 注册 | `/register` | 表单验证、条款勾选 |
| 忘记密码 | `/forgot-password` | 邮箱输入、提交反馈 |
| 重置密码 | `/reset-password` | 密码输入、确认匹配 |
| 定价 | `/pricing` | 三档方案、功能对比 |
| 生成 | `/generate` | 表单交互、图片上传 |
| 个人中心 | `/profile` | 标签切换、数据展示 |

### 5. API 连接测试

```bash
# 检查 API 健康
curl http://localhost:8989/health

# 测试认证流程 (需前端配合)
# 1. 注册账号
# 2. 登录验证
# 3. 检查 session cookie
```

### 6. 构建产物验证

```bash
ls frontend/dist/
# 应包含:
# - _astro/ (js/css assets)
# - index.html
# - login/index.html
# - ...其他页面
```
