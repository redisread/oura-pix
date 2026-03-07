# Gemini API 配置和调试指南

**你的 API Key**: `AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8`
**状态**: ✅ 已配置到 `.dev.vars`

---

## 当前问题

### 网络连接失败

**症状**:
```
❌ 网络错误: fetch failed
```

**可能原因**:
1. 🌐 **网络连接问题** - 无法访问 Google API 服务器
2. 🔒 **防火墙/代理** - 网络环境阻止了对 googleapis.com 的访问
3. 🚫 **DNS 解析失败** - 无法解析 generativelanguage.googleapis.com

---

## 解决方案

### 方案 1: 检查网络连接 (最常见)

#### 1.1 测试网络连接

```bash
# 测试能否访问 Google
curl -I https://www.google.com

# 测试能否访问 Gemini API
curl -I https://generativelanguage.googleapis.com

# 如果都失败,说明网络环境无法访问 Google 服务
```

#### 1.2 解决网络问题

**如果在中国大陆**:
- Google API 服务器在中国大陆无法直接访问
- 需要使用代理或 VPN

**配置代理** (如果有):
```bash
# 方式 1: 设置环境变量
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port

# 方式 2: 使用代理工具 (如 Clash, V2Ray 等)
# 确保代理工具正在运行并开启系统代理

# 测试代理是否生效
curl -I https://www.google.com
```

---

### 方案 2: 使用开发服务器测试 (推荐)

由于网络环境问题,建议先在开发服务器中测试,Next.js 开发服务器可能会有不同的网络配置。

#### 2.1 启动开发服务器

```bash
# 确保 .dev.vars 已配置
cat .dev.vars | grep GEMINI_API_KEY

# 启动开发服务器
npm run dev
```

#### 2.2 访问生成页面

```
打开浏览器: http://localhost:3000/generate

测试流程:
1. 上传一张商品图片
2. 配置生成设置
3. 点击"开始生成"
4. 查看浏览器控制台和服务器日志
```

这样可以在实际应用环境中测试 API 连接。

---

### 方案 3: 使用 Cloudflare Workers 环境

Cloudflare Workers 运行在全球边缘网络,通常没有网络限制。

#### 3.1 部署到 Cloudflare (推荐)

```bash
# 1. 设置生产环境 API Key
wrangler secret put GEMINI_API_KEY
# 输入: AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8

# 2. 部署应用
npm run deploy

# 3. 在生产环境测试
# 访问你的 Cloudflare 域名进行测试
```

Cloudflare Workers 环境通常可以正常访问 Google API。

---

### 方案 4: 验证 API Key 是否有效

如果网络正常,验证 API Key:

#### 4.1 在 Google AI Studio 验证

```
1. 访问: https://aistudio.google.com/
2. 登录你的 Google 账号
3. 查看 API Keys 页面
4. 确认 API Key 状态是否为 Active
5. 检查是否有使用配额
```

#### 4.2 检查 API 权限

```
1. 访问: https://console.cloud.google.com/apis/
2. 确保以下 API 已启用:
   - Generative Language API
   - (可选) Imagen API
3. 检查 API Key 的限制设置
```

---

## 配置文件检查

### 1. 检查 .dev.vars

```bash
cat .dev.vars
```

应该包含:
```env
GEMINI_API_KEY=AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8
```

### 2. 检查 wrangler.toml

```bash
cat wrangler.toml | grep -A 5 "d1_databases"
```

应该包含:
```toml
[[d1_databases]]
binding = "DB"
database_name = "oura-pix-db"
database_id = "..."
```

---

## 调试步骤

### 步骤 1: 网络测试

```bash
# 测试 Google 连接
curl -I https://www.google.com

# 测试 Gemini API 连接
curl -I https://generativelanguage.googleapis.com

# 如果失败,需要配置代理或使用 VPN
```

### 步骤 2: API Key 测试 (需要网络正常)

```bash
# 运行调试脚本
export GEMINI_API_KEY="AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8"
npx tsx scripts/debug-gemini-api.ts
```

### 步骤 3: 开发服务器测试

```bash
# 启动开发服务器
npm run dev

# 访问生成页面
open http://localhost:3000/generate

# 上传图片并测试生成
```

### 步骤 4: 查看日志

```bash
# 开发服务器日志会显示详细的错误信息
# 包括网络错误、API 错误等
```

---

## 常见错误和解决方案

### 错误 1: `fetch failed`

**原因**: 网络连接失败
**解决**:
- 检查网络连接
- 配置代理/VPN
- 或直接部署到 Cloudflare 测试

### 错误 2: `403 Forbidden`

**原因**: API Key 无效或权限不足
**解决**:
- 检查 API Key 是否正确
- 在 Google Cloud Console 检查 API 是否已启用
- 确认 API Key 没有 IP 限制

### 错误 3: `404 Not Found` (Imagen 3)

**原因**: Imagen 3 API 需要单独申请
**解决**:
- 访问: https://ai.google.dev/
- 申请 Imagen 3 Beta 访问权限
- 等待审核通过

### 错误 4: `429 Too Many Requests`

**原因**: API 调用频率超限
**解决**:
- 等待一段时间后重试
- 检查配额使用情况
- 考虑升级 API 配额

---

## 推荐的测试流程

### 优先级 1: 直接部署测试 (最快)

```bash
# 1. 设置 API Key
wrangler secret put GEMINI_API_KEY

# 2. 部署
npm run deploy

# 3. 在生产环境测试
# Cloudflare Workers 环境通常没有网络限制
```

### 优先级 2: 本地开发服务器

```bash
# 1. 确保 .dev.vars 已配置
echo "GEMINI_API_KEY=AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8" >> .dev.vars

# 2. 启动开发服务器
npm run dev

# 3. 浏览器测试
open http://localhost:3000/generate
```

### 优先级 3: 独立脚本测试 (需要网络正常)

```bash
# 仅在网络可以访问 Google 时使用
export GEMINI_API_KEY="AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8"
npx tsx scripts/debug-gemini-api.ts
```

---

## 下一步操作

### 如果网络环境无法访问 Google

**建议**: 直接部署到 Cloudflare 测试

```bash
# 1. 配置 API Key
wrangler secret put GEMINI_API_KEY

# 2. 部署
npm run deploy

# 3. 测试
# 访问你的 Cloudflare 域名
```

### 如果网络正常

**建议**: 运行完整测试流程

```bash
# 1. 测试 API
npx tsx scripts/debug-gemini-api.ts

# 2. 启动开发服务器
npm run dev

# 3. 测试功能
open http://localhost:3000/generate
```

---

## 关于 Imagen 3

### 重要说明

即使基础 Gemini API 正常工作,**Imagen 3 图像生成 API 可能需要单独申请访问权限**。

### 申请流程

1. 访问: https://ai.google.dev/
2. 登录你的 Google 账号
3. 查找 Imagen 3 相关信息
4. 申请 Beta 访问权限
5. 等待审核 (通常 1-3 天)

### 临时方案

在等待 Imagen 3 权限期间,你可以:
- 使用文本生成功能 (标题、描述、标签)
- 测试其他功能
- 准备生产环境
- 关闭图像生成功能 (设置 `generateImages: false`)

---

## 支持

### 查看文档

```bash
cat DEPLOYMENT_GUIDE.md
cat IMAGEN_README.md
```

### 运行测试

```bash
# 开发服务器测试 (推荐)
npm run dev

# API 测试 (需要网络正常)
npx tsx scripts/debug-gemini-api.ts
```

### 查看日志

```bash
# Cloudflare Workers 日志
wrangler tail

# 开发服务器日志
# 查看终端输出
```

---

**最后更新**: 2026-03-06
**API Key 状态**: ✅ 已配置
**网络状态**: ⚠️ 需要检查
**建议**: 直接部署到 Cloudflare 测试
