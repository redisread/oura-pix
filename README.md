# OuraPix

<p align="center">
  <img src="public/logo.svg" alt="OuraPix" width="120" />
</p>

<p align="center">
  <strong>AI 驱动的跨境电商商品详情页生成器</strong>
</p>

<p align="center">
  <a href="#特性">特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#部署">部署</a> •
  <a href="#技术栈">技术栈</a>
</p>

---

## ✨ 特性

OuraPix 是一款极简的 AI 驱动工具，专为跨境电商卖家设计，轻松生成专业级商品详情页。

### 核心能力

- **🤖 智能商品分析**：上传商品主图，AI 自动分析特性、卖点和最佳页面结构
- **🖼️ 批量图片生成**：一键生成 5-10 张高质量电商详情图
- **🎨 风格参考支持**：可选上传风格参考图，保持品牌一致性
- **📐 平台优化尺寸**：内置 Amazon、Shopify 等主流平台预设尺寸
- **🔥 4K 高清输出**：输出清晰专业的图片，可直接商用

### 支持平台

| 平台 | 尺寸 | 状态 |
|------|------|------|
| Amazon | 2000×2000px | ✅ 已支持 |
| Shopify | 2048×2048px | ✅ 已支持 |
| eBay | 1600×1600px | ✅ 已支持 |
| 自定义 | 灵活 | ✅ 已支持 |

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Cloudflare 账号
- Stripe 账号（支付功能）
- Google AI Studio 账号（Gemini API）

### 安装步骤

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

# 5. 配置环境变量（编辑 .env.local）
cp .env.example .env.local
# 配置 Stripe、Gemini、OAuth 等密钥

# 6. 启动开发服务器
npm run dev
```

打开 [http://localhost:4001](http://localhost:4001) 查看应用。

### 环境检查

```bash
npm run cf:check
```

---

## 🛠️ 技术栈

### 前端
- **框架**：[Astro 5](https://astro.build/) + React Islands
- **样式**：[Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **状态**：[Zustand](https://github.com/pmndrs/zustand)
- **表单**：[React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **国际化**：[paraglide-js](https://inlang.com/m/gerre34r/library-inlang-paraglideJs/)（类型安全 + tree-shaking）

### 后端
- **运行时**：[Cloudflare Workers](https://workers.cloudflare.com/)
- **数据库**：[Cloudflare D1](https://developers.cloudflare.com/d1/) + [Drizzle ORM](https://orm.drizzle.team/)
- **存储**：[Cloudflare R2](https://developers.cloudflare.com/r2/)
- **认证**：[Better Auth](https://www.better-auth.com/)

### AI 与 API
- **图片生成**：Google Gemini
- **支付**：[Stripe](https://stripe.com/)

---

## 📦 部署

### 部署到 Cloudflare Pages

```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 创建生产数据库
npx wrangler d1 create oura-pix-db
npx wrangler r2 bucket create oura-pix-images

# 3. 配置 Secrets
npx wrangler pages secret put AUTH_SECRET
npx wrangler pages secret put STRIPE_SECRET_KEY
npx wrangler pages secret put GEMINI_API_KEY

# 4. 应用数据库迁移
npm run db:migrate:prod

# 5. 部署
npm run deploy
```

### 故障排查

```bash
# 查看部署日志
npx wrangler pages deployment tail

# 检查环境状态
npm run cf:check
```

---

## 📚 文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **开发指南** | [CLAUDE.md](./CLAUDE.md) | 开发规范、命令、故障排查 |
| **部署指南** | [docs/guides/deployment.md](./docs/guides/deployment.md) | Cloudflare 部署详细步骤 |
| **架构文档** | [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构设计 |

---

## 🏗️ 项目结构

```
oura-pix/
├── frontend/          # Astro 前端
│   ├── src/
│   │   ├── components/  # React 组件
│   │   ├── pages/       # Astro 页面
│   │   ├── stores/      # Zustand 状态
│   │   └── lib/         # 工具函数
│   └── messages/        # i18n 翻译
├── api/               # Cloudflare Workers API
│   └── src/
│       ├── routes/      # API 路由
│       └── db/          # Drizzle 数据库
├── docs/              # 文档
├── packages/          # 共享包
└── public/            # 静态资源
```

---

## 🤝 贡献

欢迎贡献！请遵循以下流程：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 📄 开源协议

[MIT](./LICENSE)

---

<p align="center">
  Built with ❤️ for cross-border e-commerce sellers
</p>
