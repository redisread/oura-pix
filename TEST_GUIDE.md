# 图片生成功能测试指南

## 当前状态

✅ **代码实现完成**
- 图片分析功能 (`lib/ai-generation.ts`)
- 文本内容生成 (`lib/ai-generation.ts`)
- 场景图生成 (`lib/ai/imagen.ts`)
- R2 图片上传 (`lib/r2-image-upload.ts`)
- 前端界面 (`app/generate/page.tsx`)
- 后端 API (`app/actions/create-generation.ts`, `app/actions/get-generation.ts`)

⚠️ **网络限制**
- 当前开发环境无法直接访问 Google API（需要代理或 VPN）
- 建议在以下环境中测试：
  1. **Cloudflare Workers 生产环境**（推荐）
  2. **配置了代理的本地环境**
  3. **可以访问 Google 服务的网络环境**

---

## 测试方法

### 方法 1: Cloudflare Workers 生产环境测试（推荐）

这是最可靠的测试方法，因为 Cloudflare Workers 运行在全球边缘网络，没有网络限制。

#### 步骤 1: 配置环境变量

```bash
# 配置 API Key
wrangler secret put GEMINI_API_KEY
# 输入: AIzaSyB1aHdMue5B41v31P1g6w6bl8lwbLk8BU8

# 配置其他必要的 secrets（如果还没配置）
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put RESEND_API_KEY
```

#### 步骤 2: 部署应用

```bash
# 构建并部署
npm run deploy
```

#### 步骤 3: 测试功能

1. 访问你的 Cloudflare 域名
2. 登录账号
3. 进入生成页面 `/generate`
4. 上传一张产品图片（建议使用清晰的商品图）
5. 配置生成设置：
   - 选择平台（Amazon、Shopify 等）
   - 设置生成数量（5-10个）
   - 选择风格（专业、生活、极简、奢华）
   - 选择语言（中文、英文等）
   - **开启图像生成**
   - 设置场景图数量（3-10张）
   - 选择宽高比（1:1、3:4、4:3、9:16、16:9）
6. 点击"开始生成"
7. 观察进度条和生成过程
8. 查看生成结果

#### 预期结果

- **图片分析阶段**（约 3-5 秒）
  - 进度条显示"分析产品图片"

- **文本生成阶段**（约 10-20 秒）
  - 进度条显示"生成商品描述"
  - 生成多个标题、描述、标签变体

- **场景图生成阶段**（约 30-60 秒，取决于数量）
  - 进度条显示"生成场景图"
  - 显示当前生成进度（如 "3/5"）

- **完成阶段**
  - 显示所有生成的文本内容
  - 显示所有生成的场景图
  - 可以查看大图、下载图片

---

### 方法 2: 本地开发环境测试（需要代理）

如果你的本地环境配置了代理或 VPN，可以直接在开发服务器中测试。

#### 步骤 1: 配置代理（如果需要）

```bash
# 设置代理环境变量
export HTTP_PROXY=http://127.0.0.1:7890
export HTTPS_PROXY=http://127.0.0.1:7890

# 或者确保你的代理工具（Clash、V2Ray 等）已启动并开启系统代理
```

#### 步骤 2: 启动开发服务器

```bash
# 确保 .dev.vars 已配置
cat .dev.vars | grep GEMINI_API_KEY

# 启动开发服务器
npm run dev
```

#### 步骤 3: 测试功能

1. 打开浏览器访问 `http://localhost:3000/generate`
2. 按照方法 1 的步骤 3 进行测试
3. 查看浏览器控制台和服务器终端日志

---

### 方法 3: 使用测试脚本（需要网络正常）

如果网络可以访问 Google API，可以使用独立的测试脚本。

```bash
# 运行测试脚本
bun run scripts/test-image-generation-standalone.ts "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"
```

---

## 测试用例

### 测试用例 1: 基础文本生成（不生成图片）

**配置**:
- 平台: Amazon
- 数量: 5
- 风格: 专业
- 语言: 中文
- **图像生成: 关闭**

**预期结果**:
- 生成 5 个商品描述变体
- 每个变体包含标题、描述、标签
- 耗时约 15-20 秒

### 测试用例 2: 完整生成（包含场景图）

**配置**:
- 平台: Amazon
- 数量: 3
- 风格: 专业
- 语言: 中文
- **图像生成: 开启**
- 场景图数量: 5
- 宽高比: 1:1

**预期结果**:
- 生成 3 个商品描述变体
- 每个变体关联约 1-2 张场景图
- 总共生成 5 张场景图
- 耗时约 60-90 秒

### 测试用例 3: 多宽高比测试

**配置**:
- 平台: Shopify
- 数量: 3
- 风格: 生活
- 语言: 英文
- 图像生成: 开启
- 场景图数量: 6
- **宽高比: 16:9**（横向）

**预期结果**:
- 生成横向的场景图
- 适合网站 Banner 使用

### 测试用例 4: 奢华风格测试

**配置**:
- 平台: Etsy
- 数量: 5
- **风格: 奢华**
- 语言: 中文
- 图像生成: 开启
- 场景图数量: 5
- 宽高比: 3:4

**预期结果**:
- 文本描述使用高端、精致的语言
- 场景图呈现奢华感

---

## 故障排查

### 问题 1: 网络连接失败

**症状**:
```
❌ 网络错误: fetch failed
```

**解决方案**:
1. 检查是否能访问 Google: `curl -I https://www.google.com`
2. 如果无法访问，配置代理或直接部署到 Cloudflare 测试

### 问题 2: API Key 无效

**症状**:
```
❌ 403 Forbidden
```

**解决方案**:
1. 检查 API Key 是否正确配置
2. 访问 https://aistudio.google.com/ 验证 API Key 状态
3. 确认 API Key 没有 IP 限制

### 问题 3: Imagen API 未启用

**症状**:
```
❌ 404 Not Found (Imagen 3)
```

**解决方案**:
1. Imagen 3 需要单独申请访问权限
2. 访问 https://ai.google.dev/ 申请 Beta 访问
3. 或暂时关闭图像生成功能（`generateImages: false`）

### 问题 4: 生成超时

**症状**:
- 进度条卡住不动
- 长时间没有响应

**解决方案**:
1. 检查浏览器控制台和服务器日志
2. 减少生成数量和场景图数量
3. 检查网络连接是否稳定

### 问题 5: 图片上传失败

**症状**:
```
❌ 上传失败
```

**解决方案**:
1. 检查图片格式（支持 JPG、PNG、WebP）
2. 检查图片大小（不超过 10MB）
3. 检查 R2 存储桶配置

---

## 性能基准

基于 Gemini 2.0 Flash 和 Imagen 3 的性能：

| 阶段 | 预计耗时 | 说明 |
|------|---------|------|
| 图片分析 | 3-5 秒 | 分析产品图片特征 |
| 文本生成（5个变体） | 15-20 秒 | 生成标题、描述、标签 |
| 场景图生成（5张） | 30-60 秒 | 生成多角度场景图 |
| 图片上传到 R2 | 5-10 秒 | 上传到 Cloudflare R2 |
| **总计** | **60-90 秒** | 完整流程 |

---

## 监控和日志

### Cloudflare Workers 日志

```bash
# 实时查看日志
wrangler tail

# 过滤特定日志
wrangler tail --format=pretty
```

### 开发服务器日志

开发服务器会在终端输出详细的日志：
- API 请求和响应
- 图片生成进度
- 错误信息和堆栈跟踪

### 浏览器控制台

按 F12 打开开发者工具，查看：
- Network 标签：API 请求
- Console 标签：前端日志
- Application 标签：存储数据

---

## 下一步

### 如果测试成功

1. ✅ 验证所有功能正常工作
2. 📝 记录测试结果和性能数据
3. 🚀 准备生产环境部署
4. 📊 监控使用情况和配额

### 如果测试失败

1. 🔍 查看详细的错误日志
2. 📖 参考 `GEMINI_API_SETUP.md` 排查问题
3. 🛠️ 根据错误类型应用对应的解决方案
4. 💬 如果问题持续，检查 Google AI Studio 的 API 状态

---

## 推荐测试顺序

1. **首先测试文本生成**（关闭图像生成）
   - 验证 API 连接正常
   - 验证文本生成质量
   - 耗时短，容易排查问题

2. **然后测试少量场景图**（3张）
   - 验证 Imagen API 权限
   - 验证图片生成质量
   - 验证 R2 上传功能

3. **最后测试完整流程**（10个文本 + 10张图）
   - 验证系统稳定性
   - 验证性能表现
   - 验证配额消耗

---

## 联系支持

如果遇到无法解决的问题：

1. 查看项目文档：
   - `DEPLOYMENT_GUIDE.md`
   - `GEMINI_API_SETUP.md`
   - `IMAGEN_README.md`

2. 检查配置文件：
   - `.dev.vars`
   - `wrangler.toml`
   - `next.config.mjs`

3. 查看 GitHub Issues:
   - https://github.com/anthropics/claude-code/issues

---

**最后更新**: 2026-03-06
**测试环境**: Cloudflare Workers（推荐）
**网络要求**: 需要访问 Google API（或使用 Cloudflare Workers）
