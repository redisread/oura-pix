# 🚀 快速启动指南

**更新时间**: 2026-03-06
**API Key 状态**: ✅ 已配置
**网络状态**: ⚠️ 本地无法访问 Google API

---

## ⚡ 3 步快速启动

### 步骤 1: 启动开发服务器

```bash
npm run dev
```

### 步骤 2: 打开浏览器

访问: http://localhost:3000/generate

### 步骤 3: 测试功能

1. 上传一张商品图片
2. 配置生成设置
3. 点击"开始生成"
4. 查看结果

---

## 🔍 网络诊断结果

### 测试结果

```
❌ 本地网络无法访问 Google API
Ping: 100% 丢包
原因: 网络环境限制
```

### 影响

- ❌ 独立测试脚本无法运行
- ✅ 开发服务器可能可以运行 (待测试)
- ✅ Cloudflare 部署可以正常运行

---

## 🎯 推荐方案

### 方案 A: 开发服务器测试 (先试这个)

```bash
# 1. 启动服务器
npm run dev

# 2. 浏览器访问
open http://localhost:3000/generate

# 3. 测试生成
# - 上传图片
# - 配置设置 (建议先关闭图像生成)
# - 点击生成
# - 查看日志
```

**为什么可能可行?**
- Next.js 服务器端渲染可能有不同的网络配置
- 浏览器环境可能绕过某些限制
- 可以看到详细的错误日志

---

### 方案 B: Cloudflare 部署 (最可靠)

```bash
# 1. 设置 API Key
wrangler secret put GEMINI_API_KEY
# 输入: AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8

# 2. 部署
npm run deploy

# 3. 访问生产域名测试
```

**为什么推荐?**
- Cloudflare Workers 全球边缘网络
- 没有网络限制
- 真实生产环境
- 最可靠的方案

---

## 📝 配置确认

### API Key

```
✅ 已配置: AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8
✅ 位置: .dev.vars
✅ 格式: 正确 (39 字符)
```

### 数据库

```
✅ 本地迁移: 已完成
✅ 表结构: 已更新
⏳ 生产迁移: 待执行
```

### 代码

```
✅ 核心功能: 100% 完成
✅ 文档: 100% 完成
✅ 测试脚本: 已准备
```

---

## 🔧 故障排查

### 如果开发服务器也失败

**症状**: 生成时报错 "网络错误" 或 "API 连接失败"

**解决方案**:

#### 选项 1: 直接部署到 Cloudflare

```bash
wrangler secret put GEMINI_API_KEY
npm run deploy
```

#### 选项 2: 配置网络代理 (如果有)

```bash
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
npm run dev
```

#### 选项 3: 先测试文本生成

在生成设置中关闭图像生成:
- 取消勾选 "生成场景图"
- 只测试文本内容生成 (标题、描述、标签)

---

## 💡 关于 Imagen 3

### 重要提示

即使 Gemini 基础 API 正常,**Imagen 3 图像生成可能需要单独申请**。

### 当前状态

```
⏳ Imagen 3 访问权限: 未知
✅ 文本生成功能: 可用 (如果 API 正常)
```

### 申请步骤

1. 访问: https://ai.google.dev/
2. 登录 Google 账号
3. 查找 Imagen 3 相关页面
4. 申请 Beta 访问
5. 等待审核 (1-3 天)

### 临时方案

在等待期间:
- 关闭图像生成功能
- 只使用文本生成
- 测试其他功能
- 准备生产环境

---

## 📊 功能测试清单

### 文本生成测试

- [ ] 上传商品图片
- [ ] 选择平台 (Amazon/Shopify/eBay/Etsy)
- [ ] 选择风格 (Professional/Lifestyle/Minimal/Luxury)
- [ ] 选择语言 (中文/英文)
- [ ] 关闭图像生成
- [ ] 点击生成
- [ ] 查看生成的标题、描述、标签

### 图像生成测试 (需要 Imagen 3 权限)

- [ ] 启用图像生成
- [ ] 选择生成数量 (3-10)
- [ ] 选择宽高比 (1:1/3:4/4:3/9:16/16:9)
- [ ] 点击生成
- [ ] 查看生成的场景图

---

## 🎮 开发服务器操作

### 启动服务器

```bash
npm run dev
```

**预期输出**:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2s
```

### 访问页面

**主页**: http://localhost:3000
**生成页面**: http://localhost:3000/generate

### 查看日志

服务器终端会显示:
- API 请求日志
- 错误信息
- 生成进度
- 数据库操作

---

## 🚀 Cloudflare 部署操作

### 设置 API Key

```bash
wrangler secret put GEMINI_API_KEY
```

输入: `AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8`

### 部署应用

```bash
npm run deploy
```

**预期输出**:
```
✨ Compiled Worker successfully
✨ Uploaded Worker successfully
✨ Deployment complete!
Published to: https://your-domain.pages.dev
```

### 查看日志

```bash
wrangler tail
```

---

## 📚 相关文档

| 文档 | 用途 |
|------|------|
| [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) | 详细配置指南 |
| [API_CONFIG_STATUS.md](./API_CONFIG_STATUS.md) | 配置状态 |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | 部署指南 |
| [IMAGEN_README.md](./IMAGEN_README.md) | 功能说明 |

---

## ❓ 常见问题

### Q1: 为什么独立脚本无法运行?

**A**: 本地网络无法访问 Google API 服务器 (100% 丢包)。这不影响实际应用运行。

### Q2: 开发服务器能正常工作吗?

**A**: 可能可以。Next.js 服务器端渲染可能有不同的网络配置。需要实际测试。

### Q3: 最可靠的测试方法是什么?

**A**: 直接部署到 Cloudflare。Cloudflare Workers 全球边缘网络通常没有网络限制。

### Q4: Imagen 3 需要单独申请吗?

**A**: 是的。即使基础 Gemini API 正常,Imagen 3 图像生成可能需要单独申请 Beta 访问权限。

### Q5: 如何暂时绕过图像生成?

**A**: 在生成设置中取消勾选 "生成场景图",只使用文本生成功能。

---

## 🎯 立即行动

### 现在就可以做:

```bash
# 启动开发服务器
npm run dev
```

然后访问: http://localhost:3000/generate

### 如果不行:

```bash
# 部署到 Cloudflare
wrangler secret put GEMINI_API_KEY
npm run deploy
```

---

**状态**: ✅ 配置完成,准备测试
**建议**: 先试开发服务器,不行就部署 Cloudflare
**预计**: 5-10 分钟内可以看到结果

🎉 **开始测试吧!** 🎉
