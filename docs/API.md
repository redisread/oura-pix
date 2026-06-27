# OuraPix API 文档

## 概述

OuraPix 提供 RESTful API，允许开发者通过 API 调用生成功能。

**Base URL：** `https://api.ourapix.jiahongw.com`

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

#### 触发生成任务

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
  },
  "teamId": "optional-team-id"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "generation-id",
    "status": "pending",
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
    "imageGenerationStatus": "pending | processing | completed | failed | skipped",
    "results": [
      {
        "id": "result-id",
        "title": "商品标题",
        "description": "商品描述",
        "tags": ["tag"]
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

返回 JSON 图片 URL 列表；如果任务尚未完成返回 `NOT_READY`。

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

当前代码未实现统一 rate-limit header；如需开放外部 API，请在 `api/src/routes/v1/*` 增加限流后再补充此处。

## 示例

### cURL

```bash
# 触发生成
curl -X POST https://api.ourapix.jiahongw.com/api/v1/generate \
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
curl https://api.ourapix.jiahongw.com/api/v1/generation/{id} \
  -H "Authorization: Bearer op_xxx"

# 下载图片
curl https://api.ourapix.jiahongw.com/api/v1/generation/{id}/download \
  -H "Authorization: Bearer op_xxx"
```

## Webhook

当前线上代码只包含 Stripe 入站 webhook：`POST /api/webhooks/stripe`。生成完成的出站 webhook 尚未实现。

## 更新日志

### v1.0.0 (2026-06-17)

- 初始版本
- 支持生成、查询状态、获取图片 URL
- API Key 认证

## 相关资源

- [产品文档](./PRODUCT.md)
- [开发文档](./DEVELOPMENT.md)
- [GitHub 仓库](https://github.com/redisread/oura-pix)
