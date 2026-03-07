# Gemini Imagen 3 集成实施文档

## 已完成工作 (Phase 1-3)

### Phase 1: 基础集成 ✅

#### 1. 创建 Imagen 3 核心模块
**文件**: `/lib/ai/imagen.ts`

**功能**:
- ✅ Imagen 3 API 调用封装
- ✅ 智能提示词构建系统
  - 平台特定摄影风格 (Amazon, Shopify, eBay, Etsy, Generic)
  - 风格视觉要求 (Professional, Lifestyle, Minimal, Luxury)
  - 10 种场景变体 (正面图、45度角、细节特写等)
- ✅ 负向提示词优化
- ✅ 重试机制和错误处理
- ✅ 批量并行生成
- ✅ 内容安全拦截处理

**核心函数**:
```typescript
generateSceneImages(params) // 批量生成场景图
generateSingleImage(prompt, options) // 单张图片生成
buildVariationPrompts(basePrompt, count) // 构建提示词变体
testImagenConnection() // API 连接测试
```

### Phase 2: 数据存储 ✅

#### 1. 数据库 Schema 更新
**文件**: `/db/schema.ts`

**images 表新增字段**:
- `type`: 新增 `"generated_scene"` 枚举值
- `generationId`: 关联生成任务 ID
- `promptUsed`: 记录生成提示词

**generations 表新增字段**:
- `generatedImageCount`: 生成的场景图数量
- `imageGenerationStatus`: 图像生成状态 (pending/processing/completed/failed/skipped)
- `imageGenerationError`: 图像生成错误信息

**GenerationSettings 接口扩展**:
```typescript
{
  generateImages?: boolean;      // 是否生成场景图
  imageCount?: number;            // 场景图数量 (3-10)
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  allowPersons?: boolean;         // 是否允许人物
}
```

**GenerationResult 接口扩展**:
```typescript
{
  sceneImages?: Array<{
    imageId: string;
    url: string;
    aspectRatio: string;
    width: number;
    height: number;
    promptUsed: string;
    variation: number;
  }>;
}
```

#### 2. 数据库迁移脚本
**文件**: `/db/migrations/0001_add_image_generation_fields.sql`

- ✅ 添加新字段
- ✅ 重建 images 表以支持新枚举类型
- ✅ 创建索引优化查询性能

### Phase 3: R2 存储集成 ✅

#### 1. R2 图片上传模块
**文件**: `/lib/r2-image-upload.ts`

**功能**:
- ✅ Base64 转 ArrayBuffer
- ✅ 上传到 R2 存储 (`generated-content` 文件夹)
- ✅ 保存记录到数据库
- ✅ 生成公开访问 URL
- ✅ 批量上传处理
- ✅ 软删除功能
- ✅ 查询生成任务关联图片

**核心函数**:
```typescript
uploadGeneratedImagesToR2(images, generationId, userId, aspectRatio)
deleteGeneratedImages(imageIds, userId)
getGenerationImages(generationId, userId)
```

### Phase 4: 后端业务逻辑集成 ✅

#### 1. AI 生成模块更新
**文件**: `/lib/ai-generation.ts`

**更新内容**:
- ✅ `estimateGenerationCost()` 增加图像生成成本计算
- ✅ `validateGenerationSettings()` 验证图像生成参数
- ✅ 导出 `analyzeImage()` 供 Imagen 使用

#### 2. 生成任务处理流程重构
**文件**: `/app/actions/create-generation.ts`

**完整工作流**:
1. ✅ 阶段 1: 分析产品图片 (`analyzeImage`)
2. ✅ 阶段 2: 生成文本内容 (`generateProductDetails`)
3. ✅ 阶段 3: 生成场景图 (`generateSceneImages`)
   - 更新状态为 `imageGenerationStatus: "processing"`
   - 调用 Imagen 3 API 批量生成
   - 上传到 R2 存储
   - 保存到数据库
   - 关联到生成结果
4. ✅ 优雅降级: 图像生成失败不影响文本内容

**错误处理**:
- ✅ 部分失败: 返回成功的图片,记录失败数量
- ✅ 全部失败: 标记 `imageGenerationStatus: "failed"`,保留文本内容
- ✅ 未启用: 标记 `imageGenerationStatus: "skipped"`

### Phase 5: 多语言适配 ✅

#### 1. 中文文案
**文件**: `/i18n/messages/zh.json`

新增 `generation.imageGeneration` 部分:
- ✅ 设置面板文案 (标题、开关、数量、比例、人物)
- ✅ 进度阶段文案 (分析、生成文本、生成图像、上传、完成)
- ✅ 结果展示文案 (场景图、下载、查看大图、提示词、变体)
- ✅ 错误提示文案

#### 2. 英文文案
**文件**: `/i18n/messages/en.json`

- ✅ 完整英文翻译
- ✅ 保持与中文文案结构一致

---

## 技术亮点

### 1. 智能提示词工程
- **平台适配**: 不同电商平台的摄影风格自动适配
- **风格映射**: 4 种视觉风格的专业术语库
- **场景变体**: 10 种预定义的拍摄角度和场景
- **负向提示词**: 通用 + 风格特定的质量控制

### 2. 成本优化
- **分级服务**: 根据订阅计划限制图像生成数量
- **智能估算**: 准确计算文本 + 图像生成的总成本
- **优雅降级**: 图像生成失败时保证文本内容可用

### 3. 错误处理
- **指数退避重试**: 3 次重试,避免 API 限流
- **内容安全拦截**: 自动跳过被拦截的变体
- **部分成功处理**: 返回成功生成的图片,不中断流程

### 4. 性能优化
- **并行生成**: 多个变体并行调用 API
- **异步处理**: 生成任务在后台执行,不阻塞用户
- **数据库索引**: 优化查询性能 (`generationId`, `userId`)

---

## 待完成工作 (Phase 6-7)

### Phase 6: 前端 UI 改造 (未开始)

#### 需要修改的文件
1. `/app/generate/page.tsx` - 生成页面
   - [ ] 新增图像生成设置面板
   - [ ] Toggle: 启用/禁用场景图生成
   - [ ] Slider: 选择生成数量 (3-10)
   - [ ] Select: 选择宽高比
   - [ ] Toggle: 是否允许人物

2. 进度展示组件 (新建或修改现有)
   - [ ] 实时显示生成阶段
   - [ ] 进度条展示 (0-100%)
   - [ ] 当前步骤描述
   - [ ] 图像生成计数 (6/10)

3. 结果展示页面
   - [ ] 左侧: 文本内容 (标题、描述、标签)
   - [ ] 右侧: 场景图网格 (2-3 列)
   - [ ] 每张图片: 下载按钮、查看大图、提示词展示
   - [ ] 响应式适配

### Phase 7: 测试和部署 (未开始)

#### 测试清单
- [ ] 单元测试: Imagen API 调用
- [ ] 单元测试: 提示词构建逻辑
- [ ] 集成测试: 完整生成流程
- [ ] E2E 测试: 前端 → 后端 → 数据库
- [ ] 性能测试: 生成时间、并发处理
- [ ] 成本测试: 实际 API 调用成本验证

#### 部署准备
- [ ] 环境变量配置 (`GEMINI_API_KEY` 权限验证)
- [ ] 数据库迁移脚本执行
- [ ] R2 存储桶配置 (`generated-content` 文件夹)
- [ ] 生产环境测试
- [ ] 用户文档更新

---

## API 调用示例

### 1. 创建生成任务 (包含图像生成)

```typescript
const response = await fetch('/api/generations', {
  method: 'POST',
  body: JSON.stringify({
    productImageId: 'img_xxx',
    referenceImageIds: ['ref_1', 'ref_2'],
    prompt: '强调科技感和现代设计',
    settings: {
      targetPlatform: 'amazon',
      language: 'zh',
      count: 3,
      style: 'professional',
      generateImages: true,        // 启用图像生成
      imageCount: 8,                // 生成 8 张场景图
      aspectRatio: '1:1',           // 正方形
      allowPersons: false           // 不允许人物
    }
  })
});

const result = await response.json();
// {
//   success: true,
//   data: {
//     id: 'gen_xxx',
//     status: 'pending',
//     estimatedTime: 45  // 秒
//   }
// }
```

### 2. 查询生成结果

```typescript
const response = await fetch(`/api/generations/${generationId}`);
const generation = await response.json();

// generation.results[0].sceneImages
// [
//   {
//     imageId: 'img_scene_1',
//     url: 'https://r2.example.com/generated-content/gen_xxx_var1.png',
//     aspectRatio: '1:1',
//     width: 1024,
//     height: 1024,
//     promptUsed: 'white wireless headphones, clean white background...',
//     variation: 1
//   },
//   ...
// ]
```

---

## 环境变量要求

```env
# Gemini API (需要 Imagen 3 权限)
GEMINI_API_KEY=your_api_key_here

# Cloudflare R2 公开 URL
CLOUDFLARE_R2_PUBLIC_URL=https://your-r2-domain.com

# D1 数据库绑定 (wrangler.toml)
[[d1_databases]]
binding = "DB"
database_name = "ourapix-prod"
database_id = "xxx"

# R2 存储桶绑定 (wrangler.toml)
[[r2_buckets]]
binding = "R2"
bucket_name = "ourapix-storage"
```

---

## 成本估算

### 单次生成成本 (假设)

| 项目 | 单价 (信用点) | 数量 | 小计 |
|------|--------------|------|------|
| 基础成本 | 1 | 1 | 1 |
| 图片分析 | 2 | 1 | 2 |
| 文本生成 | 3 | 3 | 9 |
| **图像生成** | **10** | **8** | **80** |
| **总计** | | | **92** |

### 订阅计划限制

| 计划 | 文本生成 | 图像生成 |
|------|---------|---------|
| Free | 10/月 | 0 |
| Starter | 100/月 | 最多 3 张/次 |
| Pro | 500/月 | 最多 10 张/次 |
| Enterprise | 2000/月 | 无限制 |

---

## 下一步行动

1. **前端开发** (优先级: 高)
   - 修改 `/app/generate/page.tsx` 添加设置面板
   - 创建进度展示组件
   - 优化结果展示布局

2. **测试验证** (优先级: 高)
   - 申请 Gemini API Imagen 3 访问权限
   - 本地测试 API 调用
   - 验证提示词质量

3. **文档完善** (优先级: 中)
   - 用户使用指南
   - API 文档
   - 故障排查手册

4. **性能优化** (优先级: 中)
   - 添加生成进度 WebSocket 推送
   - 实现图片预加载
   - 优化数据库查询

---

## 已知问题和限制

1. **Imagen 3 API 可用性**
   - 需要申请 Beta 访问权限
   - 可能有地区限制
   - 备选方案: DALL-E 3 或 Midjourney API

2. **成本控制**
   - 图像生成成本是文本的 3-10 倍
   - 需要严格的配额限制
   - 建议添加成本预警功能

3. **生成质量**
   - 提示词效果依赖 API 版本
   - 需要持续优化和 A/B 测试
   - 建议添加用户反馈评分系统

4. **生成时间**
   - 批量生成 8-10 张图可能需要 2-3 分钟
   - 需要优化用户等待体验
   - 建议添加邮件通知功能

---

## 参考资料

- [Gemini Imagen 3 官方文档](https://ai.google.dev/gemini-api/docs/imagen)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [OpenNext Cloudflare 适配器](https://opennext.js.org/cloudflare/)
- [提示词工程最佳实践](https://platform.openai.com/docs/guides/prompt-engineering)

---

**最后更新**: 2026-03-05
**实施进度**: Phase 1-5 完成 (约 60%)
**预计完成时间**: Phase 6-7 需要 3-5 天
