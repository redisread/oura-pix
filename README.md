# OuraPix

<p align="center">
  <img src="public/logo.svg" alt="OuraPix" width="120" />
</p>

<p align="center">
  <strong>AI 驱动的跨境电商商品详情页生成器</strong><br/>
  <span style="color: #666;">让 AI 帮你打造专业级商品详情页，提升转化率</span>
</p>

<p align="center">
  <a href="#产品价值">产品价值</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#使用场景">使用场景</a> •
  <a href="#路线图">路线图</a>
</p>

---

## 🎯 产品价值

### 为谁设计

**OuraPix 专为跨境电商卖家打造：**
- 亚马逊/Shopify/eBay 卖家
- 没有专业设计团队的中小卖家
- 需要快速生成大量商品图的内容运营
- 追求高转化率详情页的品牌商家

### 解决什么痛点

| 痛点 | 传统方式 | OuraPix |
|------|----------|---------|
| 设计成本高 | 请设计师 ¥500+/张 | AI 自动生成，成本趋近于零 |
| 制作周期长 | 3-5 天/套详情页 | 5 分钟生成完整页面 |
| 风格不统一 | 多设计师出品参差不齐 | 上传参考图，保持品牌一致性 |
| 多平台适配 | 手动调整多平台尺寸 | 一键切换平台预设尺寸 |

### 核心价值

- **🚀 效率提升 100x** — 5 分钟生成传统需要 3-5 天的详情页
- **💰 成本降低 90%** — 无需雇佣设计师，AI 生成专业级图片
- **🎨 风格统一** — 支持风格参考，保持品牌视觉一致性
- **🌍 多平台适配** — Amazon、Shopify、eBay 一键适配

---

## ✨ 核心功能

### 1. 智能商品分析
上传商品主图，AI 自动识别商品特性、卖点，智能规划详情页结构

### 2. 批量图片生成
一键生成 5-10 张高质量详情图：
- 商品卖点图
- 使用场景图
- 细节特写图
- 对比展示图
- 购买引导图

### 3. 风格参考支持
上传品牌参考图，AI 学习并保持一致视觉风格

### 4. 平台优化输出
| 平台 | 尺寸 | 特性 |
|------|------|------|
| Amazon | 2000×2000px | 白底主图 + 场景图 |
| Shopify | 2048×2048px | 品牌风格详情 |
| eBay | 1600×1600px | 简洁卖点展示 |
| 自定义 | 灵活尺寸 | 按需定制 |

### 5. 4K 高清输出
生成图片清晰度达印刷级别，可直接用于电商平台

---

## 🚀 快速开始

### 第一步：环境准备

```bash
# 克隆仓库
git clone https://github.com/redisread/oura-pix.git
cd oura-pix

# 安装依赖
npm install

# 初始化环境
npm run cf:init
npm run db:migrate
```

### 第二步：配置密钥

```bash
# 复制环境变量模板
cp .env.example .env.local

# 配置必需密钥（编辑 .env.local）
# - GEMINI_API_KEY（AI 图片生成）
# - STRIPE_SECRET_KEY（支付功能）
# - AUTH_SECRET（认证加密）
```

### 第三步：启动应用

```bash
npm run dev
```

访问 [http://localhost:4001](http://localhost:4001)

---

## 📖 使用场景

### 场景一：新品上架
**用户：** 亚马逊卖家，每周上架 10+ 新品

**流程：**
1. 上传商品主图
2. AI 自动分析并生成详情页结构
3. 一键生成 8 张详情图
4. 下载 4K 高清图片，直接上传亚马逊

**效果：** 上架准备时间从 3 天缩短到 30 分钟

### 场景二：品牌视觉统一
**用户：** Shopify 品牌店，需要保持视觉一致性

**流程：**
1. 上传品牌风格参考图
2. 批量上传多款商品主图
3. AI 统一按品牌风格生成详情图
4. 保持全店视觉统一

**效果：** 品牌一致性提升，转化率提升 15%

### 场景三：多平台铺货
**用户：** 跨平台卖家，同一商品上架多个平台

**流程：**
1. 上传商品主图
2. 选择 Amazon → 生成 2000×2000px 白底图
3. 选择 Shopify → 生成 2048×2048px 品牌风格图
4. 选择 eBay → 生成 1600×1600px 简洁图

**效果：** 一套商品素材，多平台快速适配

---

## 🛠️ 技术栈

| 层级 | 技术 | 选择理由 |
|------|------|----------|
| 前端 | Astro + React | 高性能、SEO 友好、组件化 |
| 样式 | Tailwind + Shadcn | 快速开发、设计系统一致 |
| 状态 | Zustand | 轻量、TypeScript 友好 |
| 后端 | Cloudflare Workers | 边缘部署、低延迟 |
| 数据库 | Cloudflare D1 | Serverless、自动扩缩 |
| 存储 | Cloudflare R2 | 兼容 S3、成本优化 |
| AI | Google Gemini | 图片生成质量高 |
| 支付 | Stripe | 全球覆盖、Webhook 完善 |

---

## 📦 部署

### 生产环境部署

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
npm run db:migrate:prod

# 5. 部署到生产
npm run deploy
```

---

## 🗺️ 路线图

### 当前版本（v1.0）
- ✅ AI 商品分析
- ✅ 批量图片生成
- ✅ 风格参考支持
- ✅ 多平台尺寸适配

### 短期（Q2 2026）
- 🔄 生成历史保存
- 🔄 图片编辑微调
- 🔄 批量模板导出

### 中期（Q3 2026）
- ⏳ 团队协作空间
- ⏳ A/B 测试图片
- ⏳ 转化率数据分析

### 长期（Q4 2026）
- ⏳ 智能文案生成
- ⏳ 竞品分析参考
- ⏳ 自动多语言版本

---

## 📚 文档

| 文档 | 路径 | 说明 |
|------|------|------|
| **产品文档** | [CLAUDE.md](./CLAUDE.md) | 产品规范、用户流程 |
| **开发指南** | [CLAUDE.md](./CLAUDE.md) | 开发规范、命令参考 |
| **部署指南** | [docs/guides/deployment.md](./docs/guides/deployment.md) | 生产部署步骤 |
| **架构文档** | [ARCHITECTURE.md](./ARCHITECTURE.md) | 系统架构设计 |

---

## 🤝 贡献

欢迎贡献！请遵循以下流程：

1. 阅读 [CLAUDE.md](./CLAUDE.md) 了解开发规范
2. Fork 本仓库并创建特性分支
3. 提交 PR，等待 Code Review
4. 合并后自动部署

---

## 📄 开源协议

[MIT](./LICENSE)

---

<p align="center">
  Built with ❤️ for cross-border e-commerce sellers
</p>
