# OuraPix API

Public API v1 exposes generation jobs to external clients with API Key authentication.

**Base URL:** `https://api.ourapix.jiahongw.com`

## Authentication

Send an API key in the `Authorization` header:

```http
Authorization: Bearer op_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API keys are created in the web app at `/api-keys`.

## Create Generation

```http
POST /api/v1/generate
```

```json
{
  "productImageId": "image-id",
  "referenceImageIds": ["reference-image-id"],
  "prompt": "Highlight durability and compact storage.",
  "settings": {
    "targetPlatform": "amazon",
    "language": "en",
    "count": 5,
    "style": "professional",
    "generateImages": false,
    "imageCount": 5,
    "aspectRatio": "1:1",
    "allowPersons": false
  }
}
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "generation-id",
    "status": "pending",
    "createdAt": "2026-06-27T00:00:00.000Z"
  }
}
```

## Get Generation

```http
GET /api/v1/generation/:id
```

Response:

```json
{
  "success": true,
  "data": {
    "id": "generation-id",
    "status": "completed",
    "prompt": "Highlight durability and compact storage.",
    "generatedImages": [],
    "errorMessage": null,
    "createdAt": "2026-06-27T00:00:00.000Z"
  }
}
```

Current Worker behavior generates text/content variants for the web app and returns image URLs only when `results[].imageUrl` exists. Image generation settings remain accepted for compatibility, but the Worker pipeline currently records image generation as skipped.

## Download Generated Image URLs

```http
GET /api/v1/generation/:id/download
```

If the job is complete, the endpoint returns a JSON list of generated image URLs:

```json
{
  "success": true,
  "data": {
    "id": "generation-id",
    "images": [
      {
        "index": 0,
        "url": "https://example.com/image.png"
      }
    ]
  }
}
```

If the job is not complete, the endpoint returns `409` with `NOT_READY`.

## Error Codes

| Code | Meaning |
|------|---------|
| `UNAUTHORIZED` | API key is missing, invalid, or expired |
| `NOT_FOUND` | Resource does not exist or does not belong to the caller |
| `NOT_READY` | Generation is not completed yet |
| `INTERNAL_ERROR` | Server-side failure |

## cURL

```bash
curl -X POST https://api.ourapix.jiahongw.com/api/v1/generate \
  -H "Authorization: Bearer op_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "productImageId": "image-id",
    "settings": {
      "targetPlatform": "amazon",
      "language": "en",
      "count": 5,
      "style": "minimal",
      "aspectRatio": "1:1"
    }
  }'
```

```bash
curl https://api.ourapix.jiahongw.com/api/v1/generation/{id} \
  -H "Authorization: Bearer op_xxx"
```
