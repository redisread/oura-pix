# OuraPix

<p align="center">
  <img src="public/logo.svg" alt="OuraPix" width="120" />
</p>

<p align="center">
  <strong>AI 驱动的跨境电商商品详情页生成器</strong><br/>
  <span style="color: #666;">让 AI 帮你打造专业级商品详情页，提升转化率</span>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#文档">文档</a>
</p>

---

## 🎯 产品价值

OuraPix 专为跨境电商卖家打造，解决以下痛点：

| 痛点 | 传统方式 | OuraPix |
|------|----------|---------|
| 设计成本高 | 请设计师 ¥500+/张 | AI 自动生成，成本趋近于零 |
| 制作周期长 | 3-5 天/套详情页 | 5 分钟生成完整页面 |
| 风格不统一 | 多设计师出品参差不齐 | 上传参考图，保持品牌一致性 |
| 多平台适配 | 手动调整多平台尺寸 | 一键切换平台预设尺寸 |

**核心价值：**

- **🚀 效率提升 100x** — 5 分钟生成传统需要 3-5 天的详情页
- **💰 成本降低 90%** — 无需雇佣设计师，AI 生成专业级图片
- **🎨 风格统一** — 支持风格参考，保持品牌视觉一致性
- **🌍 多平台适配** — Amazon、Shopify、eBay、Etsy 一键适配

---

## ✨ 功能特性

### 核心功能

- **智能商品分析** — AI 自动识别商品特性、卖点，智能规划详情页结构
- **批量图片生成** — 一键生成 5-10 张高质量详情图（卖点图、场景图、细节图等）
- **风格参考支持** — 上传品牌参考图，AI 学习并保持一致视觉风格
- **平台优化输出** — 支持 Amazon、Shopify、eBay、Etsy 等平台预设尺寸
- **4K 高清输出** — 生成图片清晰度达印刷级别

### 已实现功能

- ✅ 生成历史管理
- ✅ 图片收藏功能
- ✅ 图片对比视图
- ✅ 多语言支持（中文、英文、日文）
- ✅ 图片编辑器（旋转、翻转、调整亮度/对比度/饱和度、水印）
- ✅ 生成统计分析
- ✅ 通知中心
- ✅ 错误追踪与异常处理
- ✅ 性能监控
- ✅ API 访问（API Key 认证）
- ✅ 团队协作

### 规划中功能

- ⏳ 竞品分析与参考
- ⏳ 用户反馈与评价系统
- ⏳ 商品类目与行业模板

详细功能说明请查看 [产品文档](./docs/PRODUCT.md)。

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Cloudflare 账号（用于 D1、R2、Workers）
- Google Gemini API Key

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/redisread/oura-pix.git
cd oura-pix

# 2. 安装依赖
pnpm install

# 3. 初始化 Cloudflare 资源
pnpm run cf:init

# 4. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，配置 GEMINI_API_KEY、AUTH_SECRET 等

# 5. 运行数据库迁移
pnpm run db:migrate

# 6. 启动开发服务器
pnpm run dev
```

访问 [http://localhost:4001](http://localhost:4001)

详细安装步骤请查看 [开发文档](./docs/DEVELOPMENT.md)。

---

## 🛠️ 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | Astro + React | 高性能、SEO 友好、组件化 |
| 样式 | Tailwind + Shadcn | 快速开发、设计系统一致 |
| 状态 | Zustand | 轻量、TypeScript 友好 |
| 后端 | Cloudflare Workers | 边缘部署、低延迟 |
| 数据库 | Cloudflare D1 | Serverless、自动扩缩 |
| 存储 | Cloudflare R2 | 兼容 S3、成本优化 |
| AI | Google Gemini | 图片生成质量高 |
| 支付 | Stripe | 全球覆盖、Webhook 完善 |

详细技术栈说明请查看 [开发文档](./docs/DEVELOPMENT.md)。

---

## 📦 部署

```bash
# 1. 登录 Cloudflare
npx wrangler login

# 2. 创建生产资源
npx wrangler d1 create oura-pix-db
npx wrangler r2 bucket create oura-pix-images

# 3. 配置生产密钥
npx wrangler pages secret put AUTH_SECRET
npx wrangler pages secret put STRIPE_SECRET_KEY
npx wrangler pages secret put GEMINI_API_KEY

# 4. 应用数据库迁移
pnpm run db:migrate:prod

# 5. 部署到生产
pnpm run deploy
```

详细部署步骤请查看 [开发文档 - 部署章节](./docs/DEVELOPMENT.md#部署)。

---

## 📚 文档

| 文档 | 说明 |
|------|------|
| [产品文档](./docs/PRODUCT.md) | 功能介绍、使用场景、页面说明、定价说明 |
| [开发文档](./docs/DEVELOPMENT.md) | 技术栈、项目结构、本地开发、部署流程、贡献指南 |
| [API 文档](./docs/API.md) | API 端点、认证方式、请求/响应示例 |
| [CLAUDE.md](./CLAUDE.md) | Claude Code 配置、开发规范 |

---

## 🤝 贡献

欢迎贡献！请遵循以下流程：

1. 阅读 [开发文档](./docs/DEVELOPMENT.md) 了解开发规范
2. Fork 本仓库并创建特性分支：`git checkout -b feat/xxx`
3. 提交更改：`git commit -m 'feat: add xxx'`
4. 推送分支：`git push origin feat/xxx`
5. 提交 Pull Request，等待 Code Review
6. 合并后自动部署

详细贡献指南请查看 [开发文档 - 贡献指南](./docs/DEVELOPMENT.md#贡献指南)。

---

## 📄 开源协议

[MIT](./LICENSE)

---

<p align="center">
  Built with ❤️ for cross-border e-commerce sellers
</p>
