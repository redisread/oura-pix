# OuraPix

<p align="center">
  <img src="public/logo.svg" alt="OuraPix Logo" width="120" />
</p>

<p align="center">
  <strong>AI-Powered Cross-Border E-commerce Product Detail Page Generator</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#architecture">Architecture</a>
</p>

---

## Features

OuraPix is a minimalist AI-powered tool designed for cross-border e-commerce sellers to generate professional product detail pages effortlessly.

### Core Capabilities

- **Smart Product Analysis**: Upload your product main image and let AI automatically analyze features, selling points, and optimal page structure
- **Batch Image Generation**: Generate 5-10 high-quality e-commerce detail images in one click
- **Style Reference Support**: Optionally upload style reference images to maintain brand consistency
- **Platform-Optimized Sizes**: Built-in presets for Amazon, Shopify, and other major platforms
- **4K HD Output**: Crystal clear images ready for professional use

### Supported Platforms

| Platform | Dimensions | Status |
|----------|-----------|--------|
| Amazon | 2000x2000px | Supported |
| Shopify | 2048x2048px | Supported |
| eBay | 1600x1600px | Supported |
| Custom | Flexible | Supported |

## Tech Stack

### Frontend
- **Framework**: [Next.js 14+](https://nextjs.org/) with App Router
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)

### Backend
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)

### AI & APIs
- **Image Generation**: Google Gemini Banana
- **Payments**: [Stripe](https://stripe.com/)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account
- Stripe account (for payments)
- Google AI Studio account (for Gemini API)

### 快速开始

使用一键初始化脚本快速设置开发环境:

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/oura-pix.git
cd oura-pix

# 2. 安装依赖
npm install

# 3. 初始化 Cloudflare 本地环境
npm run cf:init

# 4. 配置第三方服务密钥（编辑 .env.local）
# 详见下方"环境配置"章节

# 5. 启动开发服务器
npm run dev
```

打开 [http://localhost:4001](http://localhost:4001) 查看应用。

### 环境状态检查

随时使用以下命令检查本地 Cloudflare 环境状态:

```bash
npm run cf:check
```

这将显示:
- Wrangler 版本
- D1 数据库状态（表结构、文件大小）
- R2 存储状态
- 环境变量配置
- 数据库迁移状态
- 总体就绪状态

### 手动安装

如果您偏好手动设置,可以按照以下步骤:

<details>
<summary>点击展开手动安装步骤</summary>

1. **安装依赖**
   ```bash
   npm install
   ```

2. **创建环境配置文件**
   ```bash
   cp .env.example .env.local
   ```

3. **生成认证密钥**
   ```bash
   # 生成 AUTH_SECRET 并自动写入 .env.local
   echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
   ```

4. **初始化 Cloudflare 本地环境**
   ```bash
   # 初始化本地 D1 数据库、R2 存储和类型定义
   npm run cf:init
   ```

5. **配置第三方服务**

   编辑 `.env.local` 文件,配置以下服务:

   - **Stripe**: https://dashboard.stripe.com/apikeys
   - **Google OAuth**: https://console.cloud.google.com/apis/credentials
   - **GitHub OAuth**: https://github.com/settings/developers
   - **Gemini AI**: https://aistudio.google.com/app/apikey

6. **启动开发服务器**
   ```bash
   npm run dev
   ```

</details>

### 环境配置

#### 本地开发环境

本地开发需要配置 `.env.local` 文件（不会被提交到 Git）。

**必需配置:**

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `AUTH_SECRET` | 认证加密密钥 | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | 应用基础 URL | `http://localhost:4001` |

**功能配置（按需启用）:**

| 功能 | 必需变量 | 获取链接 |
|------|----------|----------|
| **支付功能** | `STRIPE_SECRET_KEY`<br>`STRIPE_WEBHOOK_SECRET`<br>`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| **AI 生成** | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **Google 登录** | `AUTH_GOOGLE_ID`<br>`AUTH_GOOGLE_SECRET` | [Google Console](https://console.cloud.google.com/apis/credentials) |
| **GitHub 登录** | `AUTH_GITHUB_ID`<br>`AUTH_GITHUB_SECRET` | [GitHub Settings](https://github.com/settings/developers) |

**Cloudflare 配置:**

本地开发时,D1 数据库和 R2 存储通过 `wrangler` 自动配置,无需额外环境变量。

#### 生产环境

生产环境的敏感信息通过 Cloudflare Secrets 管理,不使用 `.env` 文件。

详见下方"部署"章节。

## 部署

### 部署到 Cloudflare Pages

#### 1. 准备工作

**登录 Cloudflare:**
```bash
npx wrangler login
```

**创建生产环境数据库:**
```bash
# 创建 D1 数据库
npx wrangler d1 create oura-pix-db

# 将返回的 database_id 填入 wrangler.toml
# 找到 [[d1_databases]] 部分,取消注释并填入 database_id
```

**创建 R2 存储桶:**
```bash
npx wrangler r2 bucket create oura-pix-images
```

#### 2. 配置 Secrets

所有敏感信息必须通过 Cloudflare Secrets 管理:

```bash
# 必需的 secrets
npx wrangler pages secret put AUTH_SECRET
npx wrangler pages secret put STRIPE_SECRET_KEY
npx wrangler pages secret put STRIPE_WEBHOOK_SECRET
npx wrangler pages secret put GEMINI_API_KEY

# 可选的 OAuth secrets
npx wrangler pages secret put AUTH_GOOGLE_ID
npx wrangler pages secret put AUTH_GOOGLE_SECRET
npx wrangler pages secret put AUTH_GITHUB_ID
npx wrangler pages secret put AUTH_GITHUB_SECRET
```

**查看已配置的 secrets:**
```bash
npx wrangler pages secret list
```

#### 3. 配置环境变量

编辑 `wrangler.toml` 文件,在 `[env.production.vars]` 部分配置:

```toml
[env.production.vars]
NEXT_PUBLIC_APP_URL = "https://your-domain.pages.dev"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_live_..."
CLOUDFLARE_R2_PUBLIC_URL = "https://cdn.your-domain.com"

# Stripe 价格 ID
STRIPE_STARTER_PRICE_ID = "price_..."
STRIPE_PRO_PRICE_ID = "price_..."
# ... 其他价格 ID
```

#### 4. 运行数据库迁移

```bash
# 应用迁移到生产数据库
npm run db:migrate:prod
```

#### 5. 部署

**自动部署（推荐）:**
```bash
# 部署到默认环境（包含部署前检查）
npm run deploy

# 部署到生产环境
npm run deploy:prod
```

**手动部署:**
```bash
# 构建
npm run build:cf

# 部署
npx wrangler pages deploy

# 或部署到特定环境
npx wrangler pages deploy --env production
```

#### 6. 验证部署

部署完成后,访问您的应用 URL 并测试:

- ✅ 用户注册/登录
- ✅ OAuth 登录（如已配置）
- ✅ AI 图片生成
- ✅ Stripe 支付流程
- ✅ 图片上传和存储

### 故障排查

**部署前检查失败?**

运行部署前检查脚本查看详细错误:
```bash
npm run predeploy
```

**数据库连接失败?**

确保 `wrangler.toml` 中的 `database_id` 正确配置:
```bash
# 列出所有 D1 数据库
npx wrangler d1 list
```

**Secrets 未生效?**

Secrets 更新后需要重新部署:
```bash
npm run deploy
```

**查看部署日志:**
```bash
npx wrangler pages deployment tail
```

## Project Structure

```
oura-pix/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Dashboard routes group
│   │   ├── dashboard/
│   │   ├── projects/
│   │   └── settings/
│   ├── api/                 # API routes
│   │   ├── auth/           # Better Auth endpoints
│   │   ├── generate/       # AI generation API
│   │   ├── stripe/         # Payment webhooks
│   │   └── upload/         # Image upload handlers
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/              # React components
│   ├── ui/                 # Shadcn UI components
│   ├── auth/               # Authentication components
│   ├── generate/           # Generation workflow components
│   └── layout/             # Layout components
├── lib/                     # Utility libraries
│   ├── auth.ts             # Better Auth configuration
│   ├── db/                 # Database configuration
│   │   ├── schema.ts       # Drizzle schema
│   │   └── index.ts        # Database client
│   ├── stripe.ts           # Stripe configuration
│   └── utils.ts            # Helper utilities
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript type definitions
├── public/                  # Static assets
├── styles/                  # Global styles
├── messages/                # i18n translation files
│   ├── en.json
│   ├── zh.json
│   └── ja.json
├── drizzle.config.ts        # Drizzle ORM configuration
├── next.config.js           # Next.js configuration
├── wrangler.toml            # Cloudflare Workers configuration
└── package.json
```

## Architecture

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- Documentation: [https://docs.oura-pix.com](https://docs.oura-pix.com)
- Issues: [GitHub Issues](https://github.com/yourusername/oura-pix/issues)
- Email: support@oura-pix.com

---

<p align="center">
  Built with ❤️ for cross-border e-commerce sellers
</p>
