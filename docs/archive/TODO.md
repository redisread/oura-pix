# TODO

## 高优先级功能

### Gemini Imagen 3 商品场景图生成 (进行中)

#### ✅ Phase 1-5 已完成 (2026-03-05)
- [x] 创建 `/lib/ai/imagen.ts` - Imagen 3 API 集成模块
- [x] 创建 `/lib/r2-image-upload.ts` - R2 图片上传模块
- [x] 更新 `/db/schema.ts` - 数据库 Schema 扩展
- [x] 创建 `/db/migrations/0001_add_image_generation_fields.sql` - 数据库迁移
- [x] 更新 `/lib/ai-generation.ts` - 成本估算和设置验证
- [x] 更新 `/app/actions/create-generation.ts` - 完整生成流程集成
- [x] 更新 `/i18n/messages/zh.json` - 中文多语言文案
- [x] 更新 `/i18n/messages/en.json` - 英文多语言文案
- [x] 创建 `/scripts/test-imagen.ts` - API 测试脚本
- [x] 创建 `IMAGEN_IMPLEMENTATION.md` - 实施文档

#### ✅ Phase 6: 前端 UI 改造 (已完成 2026-03-05)
- [x] 修改 `/app/generate/page.tsx` - 生成页面
  - [x] 新增图像生成设置面板 (Toggle, Slider, Select)
  - [x] 启用/禁用场景图生成开关
  - [x] 生成数量选择器 (3-10)
  - [x] 宽高比选择 (1:1, 3:4, 4:3, 9:16, 16:9)
  - [x] 允许人物开关
- [x] 创建进度展示组件 `/app/components/generation-progress.tsx`
  - [x] 实时显示生成阶段 (analyzing/generating_text/generating_images/uploading)
  - [x] 进度条 (0-100%)
  - [x] 当前步骤描述
  - [x] 图像生成计数显示
- [x] 修改结果展示页面
  - [x] 文本内容展示 (标题、描述、标签)
  - [x] 场景图网格 (3 列响应式)
  - [x] 每张图片卡片: 缩略图、下载按钮、查看大图、变体编号
  - [x] 响应式布局
- [x] 更新 `/app/actions/get-generation.ts` - 返回图像生成状态

#### 🔄 Phase 7: 测试和部署 (进行中)

**本地环境** (已完成):
- [x] 执行本地数据库迁移 (12 commands executed successfully)
- [x] 创建测试脚本 (`scripts/test-imagen-standalone.ts`)
- [x] 创建迁移验证脚本 (`scripts/verify-migration.sh`)
- [x] 创建部署指南 (`DEPLOYMENT_GUIDE.md`)
- [x] 创建状态报告 (`STATUS_REPORT.md`)

**待执行** (阻塞: API 访问权限):
- [ ] **关键**: 申请 Gemini API Imagen 3 访问权限
  - 访问: https://ai.google.dev/
  - 申请 Beta 访问
  - 等待审核 (1-3 天)
- [ ] **关键**: 验证 API 连接
  ```bash
  export GEMINI_API_KEY="your_key"
  npx tsx scripts/test-imagen-standalone.ts
  ```
- [ ] **关键**: 执行生产环境数据库迁移
  ```bash
  # 备份
  wrangler d1 export oura-pix-db --output=backup.sql
  # 迁移
  wrangler d1 execute oura-pix-db \
    --file=db/migrations/0001_add_image_generation_fields.sql
  ```
- [ ] 运行完整功能测试
- [ ] 性能测试: 生成时间、并发处理
- [ ] 成本测试: 实际 API 调用成本验证
- [ ] 生产环境部署 (参考 `DEPLOYMENT_GUIDE.md`)
- [ ] 监控和优化

**详细文档**:
- 实施文档: `IMAGEN_IMPLEMENTATION.md`
- API 使用指南: `docs/imagen-api-guide.md`
- 数据库迁移指南: `docs/database-migration-guide.md`
- 部署检查清单: `docs/deployment-checklist.md`

---

## 低优先级优化

### ✅ Fix 8: Stripe Webhook 补全 (已完成 2026-03-07)
- [x] `handleInvoicePaymentSucceeded`: 补全 priceId → plan 映射逻辑（使用 `SUBSCRIPTION_PLANS` 常量），调用 `addCredits` 充值月度额度
- [x] `handleInvoicePaymentFailedWebhook`: 更新订阅状态为 `past_due`
- [x] `handleTrialWillEnd`: 发送试用到期提醒邮件
- [x] `handleAsyncPaymentFailed`: 记录失败日志，通知用户

### ✅ Fix 9: `app/layout.tsx` 元数据国际化 (已完成 2026-03-07)
- [x] 将静态 `metadata` 对象改为 `generateMetadata` 动态函数，根据用户语言 cookie 返回正确语言的标题/描述

---

## 前后端分离改造 (进行中 2026-03-15)

### ✅ Phase 1: 基础设施准备 (已完成)
- [x] 设置 Monorepo 目录结构
- [x] 配置 pnpm workspace (pnpm-workspace.yaml)
- [x] 配置 Turborepo (turbo.json)
- [x] 创建共享包 `@oura-pix/database`
  - [x] Drizzle schema 迁移
  - [x] 类型导出
  - [x] 数据库工具函数
- [x] 创建共享包 `@oura-pix/api-client`
  - [x] HTTP 客户端封装
  - [x] API 端点定义
  - [x] 类型定义
- [x] 创建 Hono API 应用 (`apps/api`)
  - [x] Hono 应用框架
  - [x] 中间件 (认证、CORS、日志)
  - [x] 路由结构

### ✅ Phase 2: API 迁移 (已完成)
- [x] 认证服务迁移
  - [x] Better Auth 集成到 Hono
  - [x] 登录/注册/会话路由
  - [x] 密码重置功能
- [x] 业务服务迁移
  - [x] 生成任务 API (`/api/generations`)
  - [x] 图片上传 API (`/api/upload`)
  - [x] 订阅 API (`/api/subscription`)
- [x] Webhook 迁移
  - [x] Stripe Webhook 处理
  - [x] 订阅状态同步
- [x] 配置 API Worker 部署
  - [x] `apps/api/wrangler.jsonc`
  - [x] D1/R2 绑定
  - [x] Secrets 配置

### ✅ Phase 3: 前端迁移 (已完成 2026-03-15)
- [x] 分离 Next.js Web 应用
  - [x] 创建 `apps/web/package.json`
  - [x] 配置 `apps/web/wrangler.jsonc`
  - [x] 迁移现有代码到 `apps/web`
  - [x] 移除 API routes (`app/api/`)
  - [x] 更新认证逻辑使用 API 客户端
  - [x] 更新所有 API 调用
  - [x] 创建客户端工具函数 (`@/lib/auth.ts`, `@/lib/source.ts`)
  - [x] 修复 TypeScript 类型错误
- [x] 配置环境变量
  - [x] 设置 `NEXT_PUBLIC_API_URL` (`.env.local`)
  - [x] 配置 Secrets (`apps/api/.dev.vars`)
- [x] 构建验证
  - [x] API TypeScript 编译通过
  - [x] Web TypeScript 编译通过
  - [x] Turborepo 构建成功

### Phase 4: 测试和部署 (进行中 2026-03-15)

**本地测试** (已完成):
- [x] API 健康检查测试通过 (`curl http://localhost:8790/health`)
- [x] API 认证中间件测试通过 (返回 401 无 token 时)
- [x] Web 应用启动成功 (`http://localhost:4001`)
- [x] API 和 Web 同时运行验证通过

**待测试**:
- [ ] 完整认证流程 (注册/登录/登出)
- [ ] 生成任务创建和查询
- [ ] 图片上传到 R2
- [ ] 订阅创建和管理
- [ ] Stripe Webhook 处理

**部署准备**:
- [ ] 配置生产环境变量
- [ ] 更新生产域名 (CORS, trustedOrigins)
- [ ] 部署 API Worker: `cd apps/api && npm run deploy`
- [ ] 部署 Web Pages: `cd apps/web && npm run deploy`
- [ ] 生产环境验证

---

## 历史代码清理 (已完成 2026-04-05)

### Phase 5: 根目录无用代码清理 (已完成 2026-04-05) ✅

**清理工具已创建**:
- [x] 创建 `scripts/cleanup-unused-code.sh` - 主清理脚本
- [x] 创建 `scripts/analyze-unused.js` - 分析工具
- [x] 创建 `knip.config.js` - Knip 配置
- [x] 创建 `docs/cleanup-guide.md` - 使用指南

**清理角色已创建** (2026-04-03):
- [x] 创建 `scripts/cleanup-master.sh` - 清理总控脚本
- [x] 创建 `scripts/cleanup-roles/` - 清理角色目录
  - [x] `01-api-routes-cleaner.sh` - API 路由清理者
  - [x] `02-server-actions-cleaner.sh` - Server Actions 清理者
  - [x] `03-deprecated-lib-cleaner.sh` - 废弃 Lib 清理者
  - [x] `04-root-config-cleaner.sh` - 根目录配置清理者
  - [x] `05-components-hooks-cleaner.sh` - Components/Hooks 清理者
  - [x] `06-final-app-cleaner.sh` - 最终 App 清理者
- [x] 创建 `scripts/cleanup-roles/README.md` - 使用文档

**已执行清理** (2026-04-05):
- [x] 删除根目录废弃的 lib 文件 (11 个文件) → 备份至 `.cleanup-backup/unused-*`
  - [x] `lib/ai-generation.ts`
  - [x] `lib/ai/gemini.ts`
  - [x] `lib/ai/imagen.ts`
  - [x] `lib/api/generations.ts`
  - [x] `lib/blog.ts`
  - [x] `lib/auth-client.ts`
  - [x] `instrumentation.ts`
  - [x] `i18n/config.ts`
  - [x] `db/index.ts`
  - [x] `db/schema.ts`
  - [x] `drizzle.config.ts`
- [x] 删除子项目中的废弃文件 (4 个文件)
  - [x] `apps/web/src/lib/api.ts`
  - [x] `apps/api/src/lib/cloudflare.ts`
  - [x] `apps/api/src/services/dashscope.ts`
  - [x] `apps/web/.astro/`
- [x] 清理构建缓存
  - [x] `apps/api/.wrangler/tmp/`
  - [x] `apps/web/.astro/`
  - [x] `.turbo/`
- [x] 清理临时文件 (*.log, *.tmp, *.bak, *.old)
- [x] 保留共享 lib 文件 (18 个文件保留在根目录)

**历史清理** (2026-04-03):
- [x] 删除 `app/api/` → 备份至 `.cleanup-backup/api-routes-*`
- [x] 删除 `app/actions/` → 备份至 `.cleanup-backup/server-actions-*`
- [x] 删除 `lib/auth.ts` 和 `lib/source.ts` (其他文件保留)
- [x] 删除 `components/` → 备份至 `.cleanup-backup/components-hooks-*`
- [x] 删除 `hooks/` → 备份至 `.cleanup-backup/components-hooks-*`
- [x] 删除根目录配置文件 → 备份至 `.cleanup-backup/root-config-*`
  - [x] `next.config.js`
  - [x] `tailwind.config.ts`
  - [x] `postcss.config.js`
  - [x] `middleware.ts`
  - [x] `env.d.ts`
  - [x] `cloudflare-env.d.ts`
  - [x] `open-next.config.ts`
  - [x] `eslint.config.mjs`
- [x] 删除根目录 `app/` → 备份至 `.cleanup-backup/app-final-*`

**备份位置**: `.cleanup-backup/` 目录下

**验证结果**:
- [x] 构建测试通过 (`pnpm build` - 1m28s)
- [x] 所有子项目构建成功 (api-client, api, web)

**文档**:
- [x] `CLEANUP_SUMMARY.md` - 总结报告
- [x] `CLEANUP_COMPLETE.md` - 详细报告
- [x] `CLEANUP_README.md` - 快速参考
- [x] `docs/cleanup-guide.md` - 使用指南

---

## 移动端开发 (待规划)

- [ ] 创建 Expo 项目 (`apps/mobile`)
- [ ] 集成 `@oura-pix/api-client`
- [ ] 实现认证功能
- [ ] 实现图片上传
- [ ] 实现生成任务
- [ ] 实现历史记录查看

