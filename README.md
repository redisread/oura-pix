# OuraPix

<p align="center">
  <img src="public/logo.svg" alt="OuraPix 徽标" width="120" />
</p>

<p align="center">
  <strong>AI 驱动的跨境电商商品详情页生成器</strong>
</p>

<p align="center">
  <a href="#特性">特性</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#部署">部署</a> •
  <a href="#架构">架构</a>
</p>

---

## 特性

OuraPix 是一款极简的 AI 驱动工具，专为跨境电商卖家设计，轻松生成专业级商品详情页。

### 核心能力

- **智能商品分析**：上传商品主图，AI 自动分析特性、卖点和最佳页面结构
- **批量图片生成**：一键生成 5-10 张高质量电商详情图
- **风格参考支持**：可选上传风格参考图，保持品牌一致性
- **平台优化尺寸**：内置 Amazon、Shopify 等主流平台预设尺寸
- **4K 高清输出**：输出清晰专业的图片，可直接商用

### 支持平台

| 平台 | 尺寸 | 状态 |
|------|------|------|
| Amazon | 2000x2000px | 已支持 |
| Shopify | 2048x2048px | 已支持 |
| eBay | 1600x1600px | 已支持 |
| 自定义 | 灵活 | 已支持 |

## 技术栈

### 前端
- **框架**：[Astro 5](https://astro.build/) + React Islands
- **样式**：[Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **状态管理**：[Zustand](https://github.com/pmndrs/zustand)
- **表单**：[React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **国际化**：[paraglide-js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)（类型安全 + tree-shaking）

### 后端
- **运行时**：[Cloudflare Workers](https://workers.cloudflare.com/)
- **数据库**：[Cloudflare D1](https://developers.cloudflare.com/d1/) + [Drizzle ORM](https://orm.drizzle.team/)
- **存储**：[Cloudflare R2](https://developers.cloudflare.com/r2/)
- **认证**：[Better Auth](https://www.better-auth.com/)

### AI 与 API
- **图片生成**：Google Gemini
- **支付**：[Stripe](https://stripe.com/)

## 快速开始

### 前置条件

- Node.js 18+
- npm 或 yarn
- Cloudflare 账号
- Stripe 账号（支付功能）
- Google AI Studio 账号（Gemini API）

### 快速开始

使用一键初始化脚本快速设置开发环境：

```bash
# 1. 克隆仓库
git clone https://github.com/yourusername/oura-pix.git
cd oura-pix

# 2. 安装依赖
npm install

# 3. 初始化 Cloudflare 本地环境
npm run cf:init

# 4. 应用数据库迁移
npm run db:migrate

# 5. 配置第三方服务密钥（编辑 .env.local）
# 详见下方"环境配置"章节

# 6. 启动开发服务器
npm run dev
```

打开 [http://localhost:4001](http://localhost:4001) 查看应用。

### 环境状态检查

随时使用以下命令检查本地 Cloudflare 环境状态：

```bash
npm run cf:check
```

这将显示：
- Wrangler 版本
- D1 数据库状态（表结构、文件大小）
- R2 存储状态
- 环境变量配置
- 数据库迁移状态
- 总体就绪状态

### 手动安装

如果你偏好手动设置，可以按照以下步骤：

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

   编辑 `.env.local` 文件，配置以下服务：

   - **Stripe**：[https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
   - **Google OAuth**：[https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
   - **GitHub OAuth**：[https://github.com/settings/developers](https://github.com/settings/developers)
   - **Gemini AI**：[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

6. **启动开发服务器**
   ```bash
   npm run dev
   ```

</details>

### 环境配置

#### 本地开发环境

本地开发需要配置 `.env.local` 文件（不会被提交到 Git）。

**必需配置：**

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `AUTH_SECRET` | 认证加密密钥 | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | 应用基础 URL | `http://localhost:4001` |

**功能配置（按需启用）：**

| 功能 | 必需变量 | 获取链接 |
|------|----------|----------|
| **支付功能** | `STRIPE_SECRET_KEY`<br>`STRIPE_WEBHOOK_SECRET`<br>`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [Stripe 控制台](https://dashboard.stripe.com/apikeys) |
| **AI 生成** | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **Google 登录** | `AUTH_GOOGLE_ID`<br>`AUTH_GOOGLE_SECRET` | [Google 控制台](https://console.cloud.google.com/apis/credentials) |
| **GitHub 登录** | `AUTH_GITHUB_ID`<br>`AUTH_GITHUB_SECRET` | [GitHub 设置](https://github.com/settings/developers) |

**Cloudflare 配置：**

本地开发时，D1 数据库和 R2 存储通过 `wrangler` 自动配置，无需额外环境变量。

#### 生产环境

生产环境的敏感信息通过 Cloudflare Secrets 管理，不使用 `.env` 文件。

详见下方"部署"章节。

## 部署

### 部署到 Cloudflare Pages

#### 1. 准备工作

**登录 Cloudflare：**
```bash
npx wrangler login
```

**创建生产环境数据库：**
```bash
# 创建 D1 数据库
npx wrangler d1 create oura-pix-db

# 将返回的 database_id 填入 wrangler.toml
# 找到 [[d1_databases]] 部分，取消注释并填入 database_id
```

**创建 R2 存储桶：**
```bash
npx wrangler r2 bucket create oura-pix-images
```

#### 2. 配置 Secrets

所有敏感信息必须通过 Cloudflare Secrets 管理：

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

**查看已配置的 secrets：**
```bash
npx wrangler pages secret list
```

#### 3. 配置环境变量

编辑 `wrangler.toml` 文件，在 `[env.production.vars]` 部分配置：

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

**自动部署（推荐）：**
```bash
# 部署到默认环境（包含部署前检查）
npm run deploy

# 部署到生产环境
npm run deploy:prod
```

**手动部署：**
```bash
# 构建
npm run build:cf

# 部署
npx wrangler pages deploy

# 或部署到特定环境
npx wrangler pages deploy --env production
```

#### 6. 验证部署

部署完成后，访问你的应用 URL 并测试：

- ✅ 用户注册/登录
- ✅ OAuth 登录（如已配置）
- ✅ AI 图片生成
- ✅ Stripe 支付流程
- ✅ 图片上传和存储

### 故障排查

**部署前检查失败？**

运行部署前检查脚本查看详细错误：
```bash
npm run predeploy
```

**数据库连接失败？**

确保 `wrangler.toml` 中的 `database_id` 正确配置：
```bash
# 列出所有 D1 数据库
npx wrangler d1 list
```

**Secrets 未生效？**

Secrets 更新后需要重新部署：
```bash
npm run deploy
```

**查看部署日志：**
```bash
npx wrangler pages deployment tail
```

## 文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **开发指南** | [CLAUDE.md](./CLAUDE.md) | 开发规范、命令、故障排查 |
| **部署指南** | [docs/guides/deployment.md](./docs/guides/deployment.md) | Cloudflare 部署详细步骤 |
| **代码清理** | [docs/guides/cleanup.md](./docs/guides/cleanup.md) | 项目清理指南 |
| **数据库迁移** | [docs/reference/database.md](./docs/reference/database.md) | Drizzle ORM 使用 |
| **设计文档** | [docs/reference/design.md](./docs/reference/design.md) | 系统架构设计 |
| **测试文档** | [frontend/TESTING.md](./frontend/TESTING.md) | 本地测试指南 |

## 项目结构

```
oura-pix/
├── frontend/                 # Astro 前端
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── pages/          # Astro 页面
│   │   ├── layouts/        # 布局模板
│   │   ├── stores/          # Zustand 状态
│   │   └── lib/             # 工具函数
│   ├── messages/            # i18n 翻译文件
│   └── dist/                # 构建输出
├── api/                      # Cloudflare Workers API
│   ├── src/
│   │   ├── routes/          # API 路由
│   │   ├── lib/             # 工具库
│   │   └── db/              # Drizzle 数据库
│   └── wrangler.jsonc       # Workers 配置
├── docs/                     # 文档
│   ├── guides/               # 使用指南
│   ├── reference/            # 技术参考
│   └── archive/              # 归档文档
├── packages/                 # 共享包
├── public/                   # 静态资源
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD 流水线
├── CLAUDE.md                 # 开发指南
├── README.md                 # 项目说明
└── package.json              # 根配置
```

## 架构

详细架构文档请参见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 贡献

欢迎贡献！详情请参阅我们的 [贡献指南](./CONTRIBUTING.md)。

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 开源协议

本项目采用 MIT 协议开源 - 详情请参阅 [LICENSE](./LICENSE) 文件。

## 支持

- 文档：[https://docs.oura-pix.com](https://docs.oura-pix.com)
- 问题反馈：[GitHub Issues](https://github.com/yourusername/oura-pix/issues)
- 邮箱：support@oura-pix.com

---

<p align="center">
  Built with ❤️ for cross-border e-commerce sellers
</p>
