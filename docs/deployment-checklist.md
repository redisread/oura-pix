# Imagen 3 功能部署检查清单

## 部署前准备

### 1. API 访问权限 ✅

- [ ] 已申请 Google Gemini API 访问权限
- [ ] 已确认 API Key 具有 Imagen 3 访问权限
- [ ] 已测试 API 连接 (`npx tsx scripts/test-imagen.ts`)
- [ ] 已了解 API 限流和配额限制

**测试命令**:
```bash
# 设置环境变量
export GEMINI_API_KEY="your_api_key_here"

# 运行测试脚本
npx tsx scripts/test-imagen.ts

# 预期输出: ✅ API 连接成功!
```

---

### 2. 环境变量配置 ✅

#### 本地开发环境 (`.dev.vars`)

```env
# Gemini API (需要 Imagen 3 权限)
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudflare R2 公开 URL
CLOUDFLARE_R2_PUBLIC_URL=https://your-r2-domain.com

# Better Auth Secret
BETTER_AUTH_SECRET=your_secret_here

# Resend API (邮件服务)
RESEND_API_KEY=your_resend_key_here
FROM_EMAIL=noreply@yourdomain.com
```

#### 生产环境 (Cloudflare Dashboard)

- [ ] 已在 Cloudflare Dashboard 设置所有 Secrets
- [ ] 已配置 D1 数据库绑定 (`DB`)
- [ ] 已配置 R2 存储桶绑定 (`R2`)
- [ ] 已验证环境变量可访问

**验证命令**:
```bash
# 检查 wrangler.toml 配置
cat wrangler.toml

# 测试环境变量
wrangler secret list
```

---

### 3. 数据库迁移 ✅

- [ ] 已在本地环境测试迁移
- [ ] 已备份生产数据库
- [ ] 已执行迁移脚本
- [ ] 已验证表结构正确
- [ ] 已测试数据插入和查询

**执行步骤**:
```bash
# 1. 备份生产数据库
wrangler d1 export ourapix-prod --output=backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 执行迁移
wrangler d1 execute ourapix-prod --file=db/migrations/0001_add_image_generation_fields.sql

# 3. 验证迁移
wrangler d1 execute ourapix-prod --command="PRAGMA table_info(images);"
wrangler d1 execute ourapix-prod --command="PRAGMA table_info(generations);"
```

**参考文档**: [数据库迁移指南](./database-migration-guide.md)

---

### 4. R2 存储配置 ✅

- [ ] 已创建 R2 存储桶
- [ ] 已配置 CORS 规则 (允许前端访问)
- [ ] 已创建 `generated-content` 文件夹
- [ ] 已配置公开访问域名
- [ ] 已测试文件上传和访问

**CORS 配置示例**:
```json
[
  {
    "AllowedOrigins": ["https://yourdomain.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 代码审查

### 1. 后端代码 ✅

- [x] `/lib/ai/imagen.ts` - Imagen 3 API 集成
- [x] `/lib/r2-image-upload.ts` - R2 上传模块
- [x] `/lib/ai-generation.ts` - 成本估算和验证
- [x] `/app/actions/create-generation.ts` - 生成流程
- [x] `/app/actions/get-generation.ts` - 查询接口
- [x] `/db/schema.ts` - 数据库 Schema

**检查项**:
- [ ] 所有 TypeScript 类型正确
- [ ] 错误处理完善
- [ ] 日志记录充分
- [ ] 无安全漏洞 (SQL 注入、XSS 等)

---

### 2. 前端代码 ✅

- [x] `/app/generate/page.tsx` - 生成页面
- [x] `/app/components/generation-progress.tsx` - 进度组件
- [x] `/i18n/messages/zh.json` - 中文文案
- [x] `/i18n/messages/en.json` - 英文文案

**检查项**:
- [ ] UI 响应式适配 (移动端)
- [ ] 加载状态显示正确
- [ ] 错误提示用户友好
- [ ] 无控制台错误

---

### 3. 多语言文案 ✅

- [x] 中文文案完整
- [x] 英文文案完整
- [ ] 其他语言文案 (可选: 日语、德语等)

**验证方法**:
```bash
# 检查文案键值是否匹配
grep -r "tImageGen(" app/generate/page.tsx
grep "imageGeneration" i18n/messages/zh.json
grep "imageGeneration" i18n/messages/en.json
```

---

## 测试验证

### 1. 单元测试 ✅

- [ ] 提示词构建逻辑测试
- [ ] 成本估算测试
- [ ] 设置验证测试
- [ ] R2 上传测试

**运行测试**:
```bash
# 运行所有测试
npm test

# 运行特定测试
npm test -- imagen
```

---

### 2. 集成测试 ✅

- [ ] 完整生成流程测试 (文本 + 图像)
- [ ] 仅文本生成测试 (关闭图像生成)
- [ ] 部分失败场景测试
- [ ] 并发生成测试

**测试场景**:
```typescript
// 场景 1: 完整生成 (5 张图片)
{
  generateImages: true,
  imageCount: 5,
  aspectRatio: "1:1",
  allowPersons: false
}

// 场景 2: 仅文本
{
  generateImages: false
}

// 场景 3: 大量图片 (10 张)
{
  generateImages: true,
  imageCount: 10,
  aspectRatio: "16:9",
  allowPersons: true
}
```

---

### 3. 性能测试 ✅

- [ ] 单次生成时间 < 3 分钟 (10 张图片)
- [ ] 并发 5 个任务不崩溃
- [ ] 数据库查询性能 < 100ms
- [ ] R2 上传速度 < 5秒/张

**测试工具**:
```bash
# 使用 k6 或 Apache Bench 进行压力测试
k6 run load-test.js
```

---

### 4. 端到端测试 ✅

- [ ] 用户上传图片 → 生成 → 查看结果 → 下载
- [ ] 生成失败时的错误提示
- [ ] 进度条实时更新
- [ ] 场景图正确显示

**测试流程**:
1. 打开生成页面
2. 上传商品图片
3. 配置设置 (启用图像生成)
4. 点击生成
5. 观察进度条
6. 验证结果展示
7. 下载图片

---

## 部署流程

### 1. 本地验证 ✅

```bash
# 1. 安装依赖
npm install

# 2. 运行本地开发服务器
npm run dev

# 3. 测试所有功能
# - 上传图片
# - 生成内容
# - 查看结果
# - 下载图片

# 4. 检查控制台无错误
```

---

### 2. 构建验证 ✅

```bash
# 1. 构建项目
npm run build

# 2. 预览构建结果
npm run preview

# 3. 检查构建输出
ls -lh .next/

# 4. 验证 bundle 大小合理 (< 5MB)
```

---

### 3. 部署到生产环境 ✅

```bash
# 1. 确认当前分支
git branch

# 2. 推送代码到 main 分支
git push origin main

# 3. 部署到 Cloudflare
npm run deploy
# 或
wrangler deploy

# 4. 监控部署日志
wrangler tail

# 5. 验证部署成功
curl https://yourdomain.com/api/health
```

---

### 4. 部署后验证 ✅

- [ ] 访问生产环境 URL
- [ ] 测试图像生成功能
- [ ] 检查 Cloudflare Analytics
- [ ] 监控错误日志
- [ ] 验证性能指标

**监控命令**:
```bash
# 实时查看日志
wrangler tail

# 查看错误率
wrangler analytics
```

---

## 回滚计划

### 快速回滚 ✅

如果部署后发现严重问题:

```bash
# 方式 1: 回滚到上一个版本
wrangler rollback

# 方式 2: 重新部署上一个稳定版本
git checkout <previous_commit>
wrangler deploy

# 方式 3: 临时禁用图像生成功能
# 在 Cloudflare Dashboard 设置环境变量:
DISABLE_IMAGE_GENERATION=true
```

---

## 监控和告警

### 1. 关键指标 ✅

- [ ] API 调用成功率 > 95%
- [ ] 平均生成时间 < 2 分钟
- [ ] 错误率 < 5%
- [ ] R2 存储空间使用情况

### 2. 告警设置 ✅

- [ ] Cloudflare Workers 错误告警
- [ ] D1 数据库连接告警
- [ ] R2 存储容量告警
- [ ] Gemini API 配额告警

---

## 用户文档

### 1. 更新文档 ✅

- [ ] 用户使用指南
- [ ] API 文档
- [ ] FAQ 更新
- [ ] 变更日志

### 2. 用户通知 ✅

- [ ] 发布公告 (新功能上线)
- [ ] 邮件通知现有用户
- [ ] 社交媒体宣传
- [ ] 制作演示视频

---

## 团队协作

### 1. 代码审查 ✅

- [ ] 至少 1 人审查代码
- [ ] 所有评论已解决
- [ ] 测试覆盖率达标

### 2. 知识分享 ✅

- [ ] 团队成员了解新功能
- [ ] 文档已共享
- [ ] 故障排查指南已准备

---

## 最终检查

### 部署当天

- [ ] 选择低峰时段部署
- [ ] 团队成员在线待命
- [ ] 回滚方案已准备
- [ ] 监控工具已打开

### 部署完成后 1 小时

- [ ] 检查错误日志
- [ ] 验证关键功能
- [ ] 收集用户反馈
- [ ] 记录问题和改进点

### 部署完成后 24 小时

- [ ] 分析性能数据
- [ ] 评估成本消耗
- [ ] 总结经验教训
- [ ] 规划下一步优化

---

## 联系方式

**技术支持**: tech-support@yourdomain.com
**紧急联系**: emergency@yourdomain.com
**文档链接**: https://docs.yourdomain.com

---

**最后更新**: 2026-03-05
**检查清单版本**: 1.0
**负责人**: [您的名字]
**预计部署时间**: [填写日期]
