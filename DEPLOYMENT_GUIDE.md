# Imagen 3 功能部署指南

## 当前状态

✅ **已完成**:
- Phase 1-6: 核心功能开发 (100%)
- 本地数据库迁移已执行
- 代码已提交

⏳ **待完成**:
- Imagen 3 API 访问权限申请
- 生产环境数据库迁移
- 完整功能测试
- 生产环境部署

---

## 快速部署步骤

### 步骤 1: 申请 Imagen 3 API 访问权限 (必须)

**重要**: Imagen 3 目前可能处于 Beta 阶段,需要单独申请访问权限。

1. 访问 [Google AI Studio](https://ai.google.dev/)
2. 登录 Google 账号
3. 申请 Imagen 3 API Beta 访问
4. 等待审核通过 (通常 1-3 天)
5. 获取 API Key

**验证 API 访问**:
```bash
# 方式 1: 使用 curl 测试
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a white cube on white background",
    "numberOfImages": 1,
    "aspectRatio": "1:1"
  }'

# 方式 2: 使用测试脚本
export GEMINI_API_KEY="your_api_key_here"
npx tsx scripts/test-imagen-standalone.ts
```

---

### 步骤 2: 本地环境测试

#### 2.1 配置环境变量

编辑 `.dev.vars` 文件:
```env
# Gemini API (需要 Imagen 3 权限)
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudflare R2 公开 URL
CLOUDFLARE_R2_PUBLIC_URL=https://your-r2-domain.com

# Better Auth Secret (已有)
BETTER_AUTH_SECRET=your_secret_here

# 其他配置...
```

#### 2.2 验证数据库迁移

```bash
# 检查迁移状态
wrangler d1 execute oura-pix-db --local \
  --command="PRAGMA table_info(images);"

# 应该看到 generationId 和 promptUsed 字段

# 检查 generations 表
wrangler d1 execute oura-pix-db --local \
  --command="PRAGMA table_info(generations);"

# 应该看到 generatedImageCount, imageGenerationStatus, imageGenerationError 字段
```

#### 2.3 启动开发服务器

```bash
# 安装依赖 (如果需要)
npm install

# 启动开发服务器
npm run dev

# 服务器将在 http://localhost:3000 启动
```

#### 2.4 测试图像生成功能

1. 打开浏览器访问: `http://localhost:3000/generate`
2. 上传一张商品图片
3. 在设置面板中:
   - ✅ 启用 "生成场景图"
   - 选择生成数量 (3-10)
   - 选择宽高比 (1:1, 3:4 等)
   - 选择是否允许人物
4. 点击 "开始生成"
5. 观察进度条 (4 个阶段)
6. 验证结果:
   - 文本内容 (标题、描述、标签)
   - 场景图网格 (应显示生成的图片)
   - 下载功能

---

### 步骤 3: 生产环境部署

#### 3.1 备份生产数据库 (重要!)

```bash
# 备份生产数据库
wrangler d1 export oura-pix-db \
  --output=backup_$(date +%Y%m%d_%H%M%S).sql

# 验证备份文件
ls -lh backup_*.sql
```

#### 3.2 执行生产环境迁移

```bash
# 执行迁移
wrangler d1 execute oura-pix-db \
  --file=db/migrations/0001_add_image_generation_fields.sql

# 验证迁移
wrangler d1 execute oura-pix-db \
  --command="PRAGMA table_info(images);"

wrangler d1 execute oura-pix-db \
  --command="PRAGMA table_info(generations);"
```

#### 3.3 配置生产环境变量

```bash
# 设置 Gemini API Key
wrangler secret put GEMINI_API_KEY
# 输入你的 API Key

# 验证其他环境变量
wrangler secret list

# 应该看到:
# - GEMINI_API_KEY
# - BETTER_AUTH_SECRET
# - RESEND_API_KEY
# - CLOUDFLARE_R2_PUBLIC_URL (在 wrangler.toml 中配置)
```

#### 3.4 部署应用

```bash
# 构建项目
npm run build

# 部署到 Cloudflare
npm run deploy
# 或
wrangler deploy

# 等待部署完成
# 输出示例:
# ✨  Compiled Worker successfully
# ✨  Uploaded Worker successfully
# ✨  Deployment complete!
```

#### 3.5 验证生产环境

```bash
# 1. 访问生产环境
open https://yourdomain.com/generate

# 2. 测试生成功能 (与本地测试相同)

# 3. 监控日志
wrangler tail

# 4. 检查错误
# 在 Cloudflare Dashboard 查看 Workers 日志
```

---

### 步骤 4: 监控和优化

#### 4.1 设置监控

1. **Cloudflare Analytics**:
   - 访问 Cloudflare Dashboard
   - 查看 Workers 性能指标
   - 设置错误告警

2. **日志监控**:
   ```bash
   # 实时查看日志
   wrangler tail

   # 过滤错误日志
   wrangler tail | grep ERROR
   ```

3. **成本监控**:
   - 监控 Gemini API 调用量
   - 监控 R2 存储使用量
   - 监控 D1 数据库请求量

#### 4.2 性能优化

1. **图像生成优化**:
   - 根据用户反馈调整提示词
   - 优化生成数量 (默认 5 张)
   - 调整重试策略

2. **数据库优化**:
   - 监控查询性能
   - 定期清理已删除的图片
   - 优化索引

3. **R2 存储优化**:
   - 设置生命周期规则 (自动删除旧文件)
   - 配置 CDN 缓存
   - 压缩图片

---

## 故障排查

### 问题 1: Imagen API 调用失败

**错误**: `403 Forbidden` 或 `401 Unauthorized`

**解决方案**:
1. 检查 API Key 是否正确
2. 确认有 Imagen 3 访问权限
3. 检查 API 配额是否用尽

```bash
# 测试 API 连接
export GEMINI_API_KEY="your_key"
npx tsx scripts/test-imagen-standalone.ts
```

---

### 问题 2: 数据库迁移失败

**错误**: `table images already exists`

**解决方案**:
```bash
# 检查表结构
wrangler d1 execute oura-pix-db --local \
  --command="PRAGMA table_info(images);"

# 如果已包含新字段,说明迁移已执行
# 无需重复执行
```

---

### 问题 3: 图片上传到 R2 失败

**错误**: `Failed to upload to R2`

**解决方案**:
1. 检查 R2 绑定配置 (`wrangler.toml`)
2. 检查 R2 存储桶权限
3. 检查 CLOUDFLARE_R2_PUBLIC_URL 配置

```bash
# 测试 R2 连接
wrangler r2 bucket list
```

---

### 问题 4: 前端显示空白

**错误**: 场景图不显示

**解决方案**:
1. 检查浏览器控制台错误
2. 检查 R2 CORS 配置
3. 检查图片 URL 是否可访问

```bash
# 测试图片 URL
curl -I https://your-r2-domain.com/generated-content/test.png
```

---

## 回滚方案

### 快速回滚

如果生产环境出现严重问题:

```bash
# 方式 1: 回滚到上一个版本
wrangler rollback

# 方式 2: 从备份恢复数据库
wrangler d1 import oura-pix-db --file=backup_20260305.sql

# 方式 3: 临时禁用图像生成
# 在代码中设置默认值:
# generateImages: false
```

---

## 成功标准

部署成功的标志:

- ✅ API 测试通过
- ✅ 数据库迁移成功
- ✅ 本地测试通过
- ✅ 生产环境部署成功
- ✅ 功能测试通过
- ✅ 无错误日志
- ✅ 性能指标正常

---

## 下一步优化

部署完成后,可以考虑:

1. **提示词优化**: 根据用户反馈调整
2. **成本优化**: 调整生成数量和质量
3. **性能优化**: 添加缓存、CDN
4. **功能增强**:
   - 图片编辑功能
   - 批量生成
   - 自定义提示词
   - A/B 测试不同风格

---

## 相关文档

- [实施文档](./IMAGEN_IMPLEMENTATION.md)
- [API 使用指南](./docs/imagen-api-guide.md)
- [数据库迁移指南](./docs/database-migration-guide.md)
- [部署检查清单](./docs/deployment-checklist.md)
- [完成总结](./COMPLETION_SUMMARY.md)

---

## 支持

如有问题:
1. 查看文档: `docs/` 目录
2. 查看日志: `wrangler tail`
3. 检查 Cloudflare Dashboard
4. 提交 Issue

---

**最后更新**: 2026-03-05
**状态**: 待部署
**预计时间**: 1-3 天 (取决于 API 审核)
