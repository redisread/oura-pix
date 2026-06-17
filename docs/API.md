# OuraPix API 文档

## 概述

OuraPix 提供 RESTful API，允许开发者通过 API 调用生成功能。

**Base URL：** `https://api.ourapix.com`

## 认证

### API Key 认证

所有 API 请求需要在 Header 中包含 API Key：

```
Authorization: Bearer op_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 获取 API Key

1. 登录 OuraPix 应用
2. 访问 `/api-keys` 页面
3. 点击"创建 API Key"
4. 复制生成的 Key（仅显示一次）

## 端点

### 生成相关

#### 触发图片生成

```http
POST /api/v1/generate
```

**请求体：**

```json
{
  "productImageId": "string",
  "referenceImageIds": ["string"],
  "settings": {
    "targetPlatform": "amazon | shopify | ebay | etsy | generic",
    "language": "zh | en | ja",
    "count": 5,
    "style": "professional | lifestyle | minimal | luxury",
    "generateImages": true,
    "imageCount": 5,
    "aspectRatio": "1:1 | 3:4 | 4:3 | 9:16 | 16:9",
    "allowPersons": false
  }
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "generation-id",
    "status": "processing",
    "createdAt": 1234567890
  }
}
```

#### 查询生成状态

```http
GET /api/v1/generation/:id
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "generation-id",
    "status": "processing | completed | failed",
    "progress": 50,
    "results": [
      {
        "id": "result-id",
        "imageUrl": "https://...",
        "title": "商品标题",
        "description": "商品描述"
      }
    ],
    "errorMessage": null
  }
}
```

#### 下载生成的图片

```http
GET /api/v1/generation/:id/download
```

**响应：**

返回 ZIP 文件，包含所有生成的图片。

**Headers：**

```
Content-Type: application/zip
Content-Disposition: attachment; filename="generation-{id}.zip"
```

## 错误码

### 通用错误

| 错误码 | 说明 |
|--------|------|
| `UNAUTHORIZED` | 未授权，API Key 无效或已过期 |
| `NOT_FOUND` | 资源不存在 |
| `INTERNAL_ERROR` | 服务器内部错误 |

### 生成相关错误

| 错误码 | 说明 |
|--------|------|
| `NOT_READY` | 生成未完成，无法下载 |
| `GENERATION_FAILED` | 生成失败 |
| `INVALID_SETTINGS` | 生成参数无效 |

## 速率限制

- Free 套餐：每分钟 10 次请求
- Pro 套餐：每分钟 100 次请求
- Business 套餐：无限制

**响应 Header：**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1234567890
```

## SDK

### JavaScript/TypeScript

```bash
npm install ourapix
```

```typescript
import { OuraPix } from 'ourapix';

const client = new OuraPix({
  apiKey: 'op_xxx'
});

// 触发生成
const generation = await client.generate({
  productImageId: 'image-id',
  settings: {
    targetPlatform: 'amazon',
    count: 5,
    style: 'minimal'
  }
});

// 查询状态
const status = await client.getGeneration(generation.id);

// 下载图片
const zip = await client.download(generation.id);
```

### Python

```bash
pip install ourapix
```

```python
from ourapix import OuraPix

client = OuraPix(api_key='op_xxx')

# 触发生成
generation = client.generate(
    product_image_id='image-id',
    settings={
        'targetPlatform': 'amazon',
        'count': 5,
        'style': 'minimal'
    }
)

# 查询状态
status = client.get_generation(generation['id'])

# 下载图片
zip_file = client.download(generation['id'])
```

## 示例

### cURL

```bash
# 触发生成
curl -X POST https://api.ourapix.com/api/v1/generate \
  -H "Authorization: Bearer op_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "productImageId": "image-id",
    "settings": {
      "targetPlatform": "amazon",
      "count": 5,
      "style": "minimal"
    }
  }'

# 查询状态
curl https://api.ourapix.com/api/v1/generation/{id} \
  -H "Authorization: Bearer op_xxx"

# 下载图片
curl https://api.ourapix.com/api/v1/generation/{id}/download \
  -H "Authorization: Bearer op_xxx" \
  -o generation.zip
```

## Webhook

> TODO: Webhook 功能开发中

生成完成后，可以通过 Webhook 通知您的服务器。

**配置 Webhook：**

1. 访问 `/settings/webhooks` 页面
2. 添加 Webhook URL
3. 选择触发事件

**Webhook 负载：**

```json
{
  "event": "generation.completed",
  "data": {
    "id": "generation-id",
    "status": "completed",
    "results": [...]
  },
  "timestamp": 1234567890
}
```

## 更新日志

### v1.0.0 (2026-06-17)

- 初始版本
- 支持生成、查询状态、下载图片
- API Key 认证
- 速率限制

## 相关资源

- [产品文档](./PRODUCT.md)
- [开发文档](./DEVELOPMENT.md)
- [GitHub 仓库](https://github.com/redisread/oura-pix)
