# Phase 4: 测试和部署指南

**日期**: 2026-03-15
**状态**: 进行中

---

## 本地测试环境设置

### 1. 启动开发环境

```bash
# 方式一：使用 Turborepo 同时启动所有服务 (推荐)
cd /Users/victor/.superset/worktrees/oura-pix/wave-territory
pnpm dev

# 方式二：分别启动 (便于调试)
# 终端 1: 启动 API
cd apps/api && npm run dev
# API 运行在 http://localhost:8787 (或 8790)

# 终端 2: 启动 Web
cd apps/web && npm run dev
# Web 运行在 http://localhost:4001
```

### 2. 环境检查

```bash
# 检查 API 健康
curl http://localhost:8787/health

# 检查 Web 是否正常
curl http://localhost:4001
```

### 3. 测试 API 端点

#### 健康检查
```bash
curl http://localhost:8787/health
# 预期响应：{"status":"ok","timestamp":"..."}
```

#### 认证测试
```bash
# 测试登录 (使用已注册的账号)
curl -X POST http://localhost:8787/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 测试获取会话 (需要 Cookie)
curl http://localhost:8787/api/auth/session \
  -H "Cookie: ourapix.session=xxx"
```

#### 生成任务测试 (需要认证)
```bash
# 获取生成历史
curl http://localhost:8787/api/generations \
  -H "Cookie: ourapix.session=xxx"

# 创建生成任务
curl -X POST http://localhost:8787/api/generations \
  -H "Content-Type: application/json" \
  -H "Cookie: ourapix.session=xxx" \
  -d '{
    "productImageId": "img_xxx",
    "settings": {
      "targetPlatform": "amazon",
      "language": "zh",
      "count": 3,
      "style": "professional",
      "aspectRatio": "1:1"
    }
  }'
```

#### 上传测试 (需要认证)
```bash
# 获取签名 URL
curl -X POST http://localhost:8787/api/upload/signed-url \
  -H "Content-Type: application/json" \
  -H "Cookie: ourapix.session=xxx" \
  -d '{"filename": "test.jpg", "contentType": "image/jpeg"}'
```

#### 订阅测试 (需要认证)
```bash
# 获取当前订阅状态
curl http://localhost:8787/api/subscription \
  -H "Cookie: ourapix.session=xxx"

# 创建结账会话
curl -X POST http://localhost:8787/api/subscription/checkout \
  -H "Content-Type: application/json" \
  -H "Cookie: ourapix.session=xxx" \
  -d '{"plan": "pro"}'
```

---

## 生产环境部署

### 1. 配置生产环境变量

#### API Secrets (使用 Wrangler 设置)
```bash
cd apps/api

# 设置生产 Secrets
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put GEMINI_API_KEY
wrangler secret put RESEND_API_KEY

# 更新 wrangler.jsonc 中的生产域名
# BETTER_AUTH_URL: https://api.ourapix.jiahongw.com
# NEXT_PUBLIC_APP_URL: https://ourapix.jiahongw.com
```

#### Web Secrets
```bash
cd apps/web

# 设置 Pages Secrets
wrangler pages secret put BETTER_AUTH_SECRET
```

### 2. 部署 API Worker

```bash
cd apps/api

# 部署到 Cloudflare Workers
npm run deploy

# 或
pnpm api:deploy
```

### 3. 部署 Web Pages

```bash
cd apps/web

# 部署到 Cloudflare Pages
npm run deploy

# 或
pnpm web:deploy
```

### 4. 验证生产环境

```bash
# 检查 API 健康
curl https://api.ourapix.jiahongw.com/health

# 检查 Web 应用
curl https://ourapix.jiahongw.com

# 测试生产环境认证流程
# 在浏览器中访问 https://ourapix.jiahongw.com 并测试登录/注册
```

---

## 部署检查清单

### API 部署前检查
- [ ] 更新 `wrangler.jsonc` 中的 `BETTER_AUTH_URL` 为生产域名
- [ ] 更新 `wrangler.jsonc` 中的 `NEXT_PUBLIC_APP_URL` 为生产域名
- [ ] 设置所有必需的 Secrets (BETTER_AUTH_SECRET, STRIPE_*, GEMINI_API_KEY, RESEND_API_KEY)
- [ ] 确认 D1 数据库 ID 正确
- [ ] 确认 R2 bucket 名称正确
- [ ] 本地测试所有 API 端点

### Web 部署前检查
- [ ] 更新 `wrangler.jsonc` 中的 `NEXT_PUBLIC_API_URL` 为生产 API 地址
- [ ] 更新 `wrangler.jsonc` 中的 `NEXT_PUBLIC_APP_URL` 为生产域名
- [ ] 设置 Stripe Publishable Key
- [ ] 设置 Stripe Price IDs
- [ ] 本地测试所有页面路由

### 部署后验证
- [ ] API 健康检查通过
- [ ] Web 首页加载正常
- [ ] 登录/注册功能正常
- [ ] 生成任务创建成功
- [ ] 图片上传成功
- [ ] 支付流程正常

---

## 常见问题排查

### API 无法启动
```bash
# 检查 .dev.vars 文件是否存在
ls -la apps/api/.dev.vars

# 检查 Wrangler 版本
npx wrangler --version

# 查看详细日志
npm run dev -- --log-level debug
```

### CORS 错误
检查 `apps/api/src/index.ts` 中的 CORS 配置:
```typescript
app.use("/api/*", cors({
  origin: ["https://ourapix.jiahongw.com", "http://localhost:4001"],
  credentials: true,
}));
```

### 认证失败
- 检查 `BETTER_AUTH_URL` 是否正确配置
- 检查 `BETTER_AUTH_SECRET` 是否一致
- 检查 `trustedOrigins` 是否包含当前域名

### 数据库错误
```bash
# 检查本地 D1 数据库
npx wrangler d1 execute oura-pix-db --local --command "SELECT * FROM users LIMIT 5"

# 重新应用迁移
npx wrangler d1 migrations apply oura-pix-db --local
```

---

## 性能优化建议

1. **使用 Turborepo 缓存**: `pnpm build -- --cache-dir=.turbo`
2. **增量静态再生成**: 配置 ISR 支持
3. **R2 缓存**: 使用 R2 缓存静态资源
4. **CDN 缓存**: 配置 Cloudflare CDN 缓存策略

---

## 监控和日志

### 查看 API 日志
```bash
# 实时查看 Worker 日志
wrangler tail oura-pix-api

# 查看 Pages 日志
wrangler tail oura-pix-web
```

### 监控指标
- API 响应时间
- 错误率
- 并发请求数
- D1 查询性能
- R2 上传/下载速度

---

## 下一步

1. 完成本地功能测试
2. 部署到生产环境
3. 监控和优化性能
4. 开始移动端开发 (Phase 5)
