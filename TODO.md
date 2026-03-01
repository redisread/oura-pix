# TODO 待办事项

## ✅ 最近完成

- [x] 修复认证逻辑缺陷（2026-03-01）
  - 修复了所有Server Actions中使用伪造请求对象的问题
  - 现在正确使用`headers()`函数获取真实的cookie
  - 影响的文件：
    - `app/actions/create-generation.ts`
    - `app/actions/upload-image.ts`
    - `app/actions/get-generation.ts`
    - `app/actions/get-history.ts`
  - 详细说明见：`SECURITY_FIX.md`

## 🔴 核心功能待配置

### Stripe 支付集成
- [ ] 注册 Stripe 账号并获取 API 密钥
  - 访问：https://dashboard.stripe.com/apikeys
  - 需要获取：
    - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (公钥)
    - `STRIPE_SECRET_KEY` (密钥)
    - `STRIPE_WEBHOOK_SECRET` (Webhook 密钥)
- [ ] 创建 Stripe 产品和价格
  - 订阅套餐：
    - Starter 套餐 → `STRIPE_STARTER_PRICE_ID`
    - Pro 套餐 → `STRIPE_PRO_PRICE_ID`
    - Enterprise 套餐 → `STRIPE_ENTERPRISE_PRICE_ID`
  - 积分充值：
    - 小额积分 → `STRIPE_CREDITS_SMALL_PRICE_ID`
    - 中额积分 → `STRIPE_CREDITS_MEDIUM_PRICE_ID`
    - 大额积分 → `STRIPE_CREDITS_LARGE_PRICE_ID`
- [ ] 配置 Stripe Webhook
  - 开发环境：使用 Stripe CLI 进行本地测试
  - 生产环境：在 Stripe Dashboard 配置 Webhook URL
- [ ] 更新 `.env.local` 和 `wrangler.toml` 中的 Stripe 配置
- [ ] 测试支付流程（订阅和积分充值）

### OAuth 登录集成
- [ ] Google OAuth 配置
  - 访问：https://console.cloud.google.com/apis/credentials
  - 创建 OAuth 2.0 客户端 ID
  - 配置授权重定向 URI：
    - 开发环境：`http://localhost:4001/api/auth/callback/google`
    - 生产环境：`http://ourapix.jiahongw.com/api/auth/callback/google`
  - 获取并配置：
    - `AUTH_GOOGLE_ID`
    - `AUTH_GOOGLE_SECRET`
- [ ] GitHub OAuth 配置
  - 访问：https://github.com/settings/developers
  - 创建 OAuth App
  - 配置回调 URL：
    - 开发环境：`http://localhost:4001/api/auth/callback/github`
    - 生产环境：`http://ourapix.jiahongw.com/api/auth/callback/github`
  - 获取并配置：
    - `AUTH_GITHUB_ID`
    - `AUTH_GITHUB_SECRET`
- [ ] 更新 `.env.local` 中的 OAuth 配置
- [ ] 测试 Google 和 GitHub 登录流程

## 🟡 部署相关

### Cloudflare 生产环境配置
- [ ] 配置 Cloudflare Secrets（生产环境）
  ```bash
  wrangler pages secret put AUTH_SECRET
  wrangler pages secret put GEMINI_API_KEY
  wrangler pages secret put STRIPE_SECRET_KEY
  wrangler pages secret put STRIPE_WEBHOOK_SECRET
  wrangler pages secret put AUTH_GOOGLE_ID
  wrangler pages secret put AUTH_GOOGLE_SECRET
  wrangler pages secret put AUTH_GITHUB_ID
  wrangler pages secret put AUTH_GITHUB_SECRET
  ```
- [ ] 创建生产环境 D1 数据库
  ```bash
  wrangler d1 create oura-pix-db
  # 将返回的 database_id 填入 wrangler.toml
  ```
- [ ] 创建生产环境 R2 存储桶
  ```bash
  wrangler r2 bucket create oura-pix-images
  ```
- [ ] 配置 R2 自定义域名：`ourapix.cos.jiahongw.com`
- [ ] 运行数据库迁移（生产环境）
  ```bash
  wrangler d1 migrations apply oura-pix-db --remote
  ```

## 🟢 功能优化

- [ ] 添加邮箱验证功能
- [ ] 实现忘记密码流程
- [ ] 添加用户头像上传功能
- [ ] 优化图片生成队列
- [ ] 添加生成历史记录
- [ ] 实现积分消费记录查询
- [ ] 添加订阅管理页面（升级/降级/取消）
- [ ] 多语言支持完善

## 📝 文档

- [ ] 编写部署文档
- [ ] 编写 API 使用文档
- [ ] 添加用户使用指南
- [ ] 记录常见问题 FAQ

## 🔧 技术债务

- [ ] 添加单元测试
- [ ] 添加 E2E 测试
- [ ] 优化错误处理
- [ ] 添加日志记录
- [ ] 性能监控集成（Sentry/PostHog）
