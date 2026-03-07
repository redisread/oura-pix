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
