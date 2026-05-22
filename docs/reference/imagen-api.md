# Imagen 3 API 使用指南

## 快速开始

### 1. 基础配置

确保环境变量已配置:

```env
GEMINI_API_KEY=your_gemini_api_key_with_imagen_access
CLOUDFLARE_R2_PUBLIC_URL=https://your-r2-domain.com
```

### 2. 导入模块

```typescript
import { generateSceneImages } from '@/lib/ai/imagen';
import { analyzeImage } from '@/lib/ai-generation';
import { uploadGeneratedImagesToR2 } from '@/lib/r2-image-upload';
```

## 核心 API

### 1. 生成场景图

```typescript
// 步骤 1: 分析产品图片
const analysis = await analyzeImage(productImageUrl);

// 步骤 2: 生成场景图
const sceneImages = await generateSceneImages({
  productAnalysis: analysis,
  settings: {
    targetPlatform: 'amazon',      // 平台: amazon/shopify/ebay/etsy/generic
    style: 'professional',          // 风格: professional/lifestyle/minimal/luxury
    language: 'en',
    count: 3
  },
  count: 5,                          // 生成数量 (3-10)
  userPrompt: '强调科技感',          // 可选: 用户自定义提示词
  options: {
    aspectRatio: '1:1',              // 宽高比: 1:1/3:4/4:3/9:16/16:9
    allowPersons: false,             // 是否允许人物
    safetySettings: 'default'        // 安全设置: default/strict/permissive
  }
});

// 返回结果
// sceneImages: Array<{
//   base64: string;           // Base64 编码的图片数据
//   mimeType: string;         // 'image/png' 或 'image/jpeg'
//   promptUsed: string;       // 生成此图片使用的完整提示词
// }>
```

### 2. 上传到 R2

```typescript
const uploadedImages = await uploadGeneratedImagesToR2(
  sceneImages,
  generationId,
  userId,
  '1:1'  // aspectRatio
);

// 返回结果
// uploadedImages: Array<{
//   imageId: string;          // 数据库中的图片 ID
//   url: string;              // R2 公开访问 URL
//   publicUrl: string;        // 同 url
//   promptUsed: string;       // 提示词
//   width: number;            // 图片宽度
//   height: number;           // 图片高度
//   aspectRatio: string;      // 宽高比
//   variation: number;        // 变体编号 (1-10)
// }>
```

### 3. 查询生成的图片

```typescript
const images = await getGenerationImages(generationId, userId);

// 返回与 uploadedImages 相同的结构
```

### 4. 删除图片 (软删除)

```typescript
const deletedCount = await deleteGeneratedImages(
  ['img_id_1', 'img_id_2'],
  userId
);
```

## 提示词系统

### 平台特定风格

系统会根据 `targetPlatform` 自动添加平台特定的摄影风格:

| 平台 | 摄影风格 |
|------|---------|
| Amazon | 白色背景、居中构图、工作室灯光、专业柔光箱 |
| Shopify | 现代室内生活场景、自然窗光、休闲真实场景 |
| eBay | 干净的产品摄影、中性背景、清晰可见性 |
| Etsy | 手工艺术美学、天然材料背景、温暖环境光 |
| Generic | 专业产品摄影、干净背景、最佳照明 |

### 风格视觉要求

根据 `style` 参数自动添加:

| 风格 | 视觉要求 |
|------|---------|
| Professional | 工作室灯光、专业摄影、干净构图、技术精度 |
| Lifestyle | 生活场景、自然环境、真实世界背景、人性化视角 |
| Minimal | 极简美学、干净线条、简单背景、留白空间 |
| Luxury | 高端材料、精致氛围、优雅构图、奢华感 |

### 场景变体

系统会自动生成 10 种不同的拍摄角度:

1. **正面图** (front_view): 正面居中构图
2. **45度角** (45_degree): 45度动态视角
3. **细节特写** (detail_closeup): 关键特征的极近特写
4. **俯视平铺** (flat_lay): 俯视顶视图
5. **生活场景** (lifestyle_context): 使用中的生活场景
6. **侧面轮廓** (side_profile): 侧面轮廓视图
7. **组合排列** (group_arrangement): 与配件的组合摆放
8. **材质细节** (texture_detail): 材质和表面细节
9. **包装视图** (packaging_view): 带包装的开箱美学
10. **尺寸参考** (scale_reference): 尺寸参考背景

### 负向提示词

系统会自动添加负向提示词以提升质量:

**通用负向提示词**:
- blurry, low quality, pixelated, distorted
- watermark, text overlay, logo, brand name
- price tag, poor lighting, grainy, noise

**风格特定负向提示词**:
- Minimal: cluttered, busy, complex, ornate
- Professional: casual, messy, unprofessional, amateur
- Lifestyle: sterile, clinical, artificial, staged
- Luxury: cheap, low-end, budget, basic, plain

## 完整示例

### 示例 1: Amazon 专业风格白色耳机

```typescript
const analysis = await analyzeImage('https://example.com/headphones.jpg');

const sceneImages = await generateSceneImages({
  productAnalysis: analysis,
  settings: {
    targetPlatform: 'amazon',
    style: 'professional',
    language: 'en',
    count: 3
  },
  count: 8,
  options: {
    aspectRatio: '1:1',
    allowPersons: false
  }
});

// 生成的提示词示例:
// "White wireless headphones with modern design, colors: white, silver,
//  materials: plastic, metal, clean white background, centered product
//  placement, Amazon listing style, studio lighting, professional softbox
//  setup, studio lighting, professional photography, clean composition,
//  technical precision, high-end commercial quality, 4K, high resolution,
//  sharp focus, professional photography, straight-on front view,
//  centered composition"
```

### 示例 2: Shopify 生活风格手工皮包

```typescript
const analysis = await analyzeImage('https://example.com/leather-bag.jpg');

const sceneImages = await generateSceneImages({
  productAnalysis: analysis,
  settings: {
    targetPlatform: 'shopify',
    style: 'lifestyle',
    language: 'en',
    count: 3
  },
  count: 6,
  userPrompt: 'coffee shop setting, natural light, casual atmosphere',
  options: {
    aspectRatio: '4:3',
    allowPersons: true  // 允许人物出现
  }
});
```

### 示例 3: Etsy 奢华风格手工首饰

```typescript
const analysis = await analyzeImage('https://example.com/necklace.jpg');

const sceneImages = await generateSceneImages({
  productAnalysis: analysis,
  settings: {
    targetPlatform: 'etsy',
    style: 'luxury',
    language: 'en',
    count: 3
  },
  count: 5,
  options: {
    aspectRatio: '3:4',
    allowPersons: false
  }
});
```

## 错误处理

### 1. API 连接失败

```typescript
try {
  const result = await testImagenConnection();
  if (!result.success) {
    console.error('API 连接失败:', result.error);
    // 处理: 检查 GEMINI_API_KEY 是否正确
    // 检查是否有 Imagen 3 访问权限
  }
} catch (error) {
  console.error('网络错误:', error);
}
```

### 2. 部分图片生成失败

```typescript
try {
  const sceneImages = await generateSceneImages({...});

  if (sceneImages.length < requestedCount) {
    console.warn(`部分失败: 请求 ${requestedCount} 张,实际生成 ${sceneImages.length} 张`);
    // 系统会自动跳过失败的变体,返回成功的图片
  }
} catch (error) {
  // 全部失败
  console.error('场景图生成完全失败:', error);
}
```

### 3. 内容安全拦截

```typescript
// 系统会自动捕获安全拦截错误并跳过该变体
// 日志输出: "Content safety filter triggered, skipping variation: ..."
// 不会抛出异常,继续生成其他变体
```

### 4. 限流 (429 错误)

```typescript
// 系统会自动重试 3 次,使用指数退避策略
// 第 1 次: 等待 1 秒
// 第 2 次: 等待 2 秒
// 第 3 次: 等待 4 秒
// 如果仍然失败,抛出错误
```

## 性能优化

### 1. 并行生成

系统会自动并行调用 API 生成多个变体,无需手动处理。

### 2. 成本控制

```typescript
import { estimateGenerationCost } from '@/lib/ai-generation';

const cost = estimateGenerationCost(
  1,      // imageCount: 产品图数量
  3,      // generationCount: 文本生成数量
  true,   // includeImageGen: 是否包含图像生成
  8       // imageGenCount: 场景图数量
);

// 返回: 基础(1) + 图片分析(2) + 文本生成(9) + 图像生成(240) = 252 信用点
```

### 3. 分级服务

根据订阅计划限制图像生成数量:

```typescript
const PLAN_LIMITS = {
  free: { maxImages: 0 },        // 不支持图像生成
  starter: { maxImages: 3 },     // 最多 3 张
  pro: { maxImages: 10 },        // 最多 10 张
  enterprise: { maxImages: 20 }  // 无限制
};
```

## 数据库查询

### 1. 查询生成任务的场景图

```typescript
import { eq, and } from 'drizzle-orm';
import { createDb, schema } from '@/db';

const db = createDb(env.DB);

const images = await db.query.images.findMany({
  where: and(
    eq(schema.images.generationId, generationId),
    eq(schema.images.userId, userId),
    eq(schema.images.type, 'generated_scene'),
    eq(schema.images.isDeleted, false)
  ),
  orderBy: (images, { asc }) => [asc(images.createdAt)]
});
```

### 2. 查询生成任务状态

```typescript
const generation = await db.query.generations.findFirst({
  where: eq(schema.generations.id, generationId)
});

console.log('图像生成状态:', generation.imageGenerationStatus);
// 可能的值: 'pending', 'processing', 'completed', 'failed', 'skipped'

console.log('生成的场景图数量:', generation.generatedImageCount);

if (generation.imageGenerationStatus === 'failed') {
  console.error('失败原因:', generation.imageGenerationError);
}
```

## 测试

### 运行测试脚本

```bash
# 安装依赖 (如果需要)
npm install tsx

# 运行测试
npx tsx scripts/test-imagen.ts
```

### 预期输出

```
🚀 开始测试 Imagen 3 API...

📡 测试 1: API 连接测试
✅ API 连接成功!

🎨 测试 2: 生成场景图
✅ 成功生成 3 张场景图

图片 1:
  - MIME类型: image/png
  - 数据大小: 123456 字符
  - 提示词: White wireless headphones with modern design, colors: white, silver...

图片 2:
  - MIME类型: image/png
  - 数据大小: 134567 字符
  - 提示词: White wireless headphones with modern design, colors: white, silver...

图片 3:
  - MIME类型: image/png
  - 数据大小: 145678 字符
  - 提示词: White wireless headphones with modern design, colors: white, silver...

✅ 所有测试通过!
```

## 常见问题

### Q1: 如何申请 Imagen 3 访问权限?

访问 [Google AI Studio](https://ai.google.dev/) 申请 API 访问权限。Imagen 3 目前可能处于 Beta 阶段,需要单独申请。

### Q2: 生成一张图片需要多长时间?

通常 3-5 秒/张。批量生成 10 张图片约需 30-50 秒 (并行处理)。

### Q3: 如何优化提示词质量?

1. 在 `userPrompt` 中提供具体的场景描述
2. 使用专业摄影术语 (如 "bokeh", "golden hour", "soft diffused lighting")
3. 测试不同的平台和风格组合
4. 查看生成的 `promptUsed` 字段学习系统如何构建提示词

### Q4: 生成的图片版权归谁?

根据 Google Gemini API 条款,生成的图片版权归用户所有,可用于商业用途。

### Q5: 如何处理生成失败?

系统会自动优雅降级:
- 部分失败: 返回成功的图片
- 全部失败: 保留文本内容,标记 `imageGenerationStatus: "failed"`

前端应显示错误提示,但不阻止用户查看文本内容。

---

**最后更新**: 2026-03-05
**版本**: 1.0.0
