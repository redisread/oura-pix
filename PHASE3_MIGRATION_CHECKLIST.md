# Phase 3 迁移清理清单

## 目标
完成 Next.js → Astro 迁移的代码清理工作，删除旧代码，统一配置。

## 完成情况 (2024-05-21)

### 页面映射 (apps/web/app → frontend/src/pages) ✅

| 原路径 (Next.js) | 新路径 (Astro) | 状态 |
|-------------------|----------------|------|
| app/page.tsx | pages/index.astro | ✅ |
| app/login/page.tsx | pages/login.astro | ✅ |
| app/register/page.tsx | pages/register.astro | ✅ |
| app/forgot-password/page.tsx | pages/forgot-password.astro | ✅ |
| app/reset-password/page.tsx | pages/reset-password.astro | ✅ |
| app/pricing/page.tsx | pages/pricing.astro | ✅ |
| app/generate/page.tsx | pages/generate.astro | ✅ |
| app/profile/page.tsx | pages/profile.astro | ✅ |
| app/blog/page.tsx | - | ⏳ 延后 P4 |
| app/docs/[[...slug]]/page.tsx | - | ⏳ 延后 P4 |

**Phase 2 核心页面全部完成！**

---

## Phase 3 执行计划

### Phase 3.1: 删除 apps/web/ 🚀

**前置条件：**
- ✅ 所有核心页面完成
- [ ] 验证所有页面功能正常

**删除清单：**
```bash
# 1. 删除 apps/web/
rm -rf apps/web/

# 2. 更新 pnpm-workspace.yaml
# 移除 - 'apps/*'

# 3. 删除根目录 Next.js 配置
rm -f next.config.js
rm -f next.config.ts
rm -rf .next/
```

**验证步骤：**
- [ ] `pnpm install` 无错误
- [ ] `pnpm --filter @oura-pix/frontend build` 通过
- [ ] 无残留的 workspace 引用

### Phase 3.2: 依赖清理

**待移除的依赖 (根 package.json):**

```bash
# 检查并移除
pnpm rm next @next/bundle-analyzer
pnpm rm next-intl @formatjs/intl-localematcher
```

**保留在 frontend/package.json:**
- ✅ 已正确配置

### Phase 3.3: 环境变量统一

**检查清单:**
- [ ] NEXT_PUBLIC_API_URL → PUBLIC_API_URL
- [ ] 更新 .env.example
- [ ] 更新文档

**变量映射:**

| 旧变量 | 新变量 | 位置 |
|--------|--------|------|
| NEXT_PUBLIC_API_URL | PUBLIC_API_URL | frontend/.env |
| NEXT_PUBLIC_APP_URL | PUBLIC_APP_URL | frontend/.env |

### Phase 3.4: 配置清理

**删除文件:**
- [ ] apps/web/.eslintrc.js
- [ ] apps/web/.eslintrc.json
- [ ] apps/web/tsconfig.json
- [ ] apps/web/tailwind.config.ts
- [ ] apps/web/postcss.config.js
- [ ] apps/web/next.config.js
- [ ] apps/web/package.json

**更新根配置:**
- [ ] package.json workspaces
- [ ] turbo.json (如使用)
- [ ] .gitignore (移除 .next/)

### Phase 3.5: 文档更新

- [ ] 更新 README.md
- [ ] 更新 CLAUDE.md
- [ ] 删除迁移相关的临时文档

---

## 风险点

1. **环境变量**: 确保 Cloudflare 部署环境变量已更新
2. **API 路径**: 确认 /api/* 路由正确代理到后端
3. **Session Cookie**: 确认跨域 cookie 配置正确

## 回滚计划

如需回滚：
```bash
git checkout refactor/gomate-style~1 -- apps/web/
```
