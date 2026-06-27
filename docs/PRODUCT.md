# OuraPix Product Notes

OuraPix helps cross-border e-commerce sellers turn product images and prompts into reusable product-detail content. The current app combines Gemini-generated copy variants, generation history, favorites, team workflows, API access, and browser-side image utilities.

## Target Users

- Marketplace sellers publishing products across Amazon, Shopify, eBay, and Etsy.
- Small teams that need repeatable listing copy and image-prep workflows.
- Operators who want generation history, favorites, collections, and API access in one place.

## Current Value

| Value | Current Behavior |
|-------|------------------|
| Faster listing preparation | Generate multiple title/description/tag variants from product context |
| Reusable product assets | Keep generation history, favorites, collections, and compare views |
| Lightweight image operations | Use browser-side tools for background removal, collage, batch export, borders, and cutouts |
| Operational visibility | Track usage, errors, metrics, notifications, and team activity |
| API access | Create and inspect generation jobs with API keys |

## Implemented Surfaces

### Generation

Route: `/generate`

- Upload a product image.
- Add optional reference images and prompt instructions.
- Select platform, language, style, count, aspect ratio, and image-generation preference.
- Submit a generation job.
- View generated text/content variants.
- In local/demo mode, Gemini can be unconfigured; the API returns placeholder variants.

Current Worker behavior: `api/src/services/geminiService.ts` generates product copy/content. Image generation fields are retained in settings and database records, but image generation is marked as skipped by the Worker pipeline.

### History

Route: `/history`

- List past generation jobs.
- Filter by platform, status, and time range.
- Open generated content details.
- Delete generation records.
- Launch the editor/compare flows from available image URLs.

### Favorites and Collections

Routes: `/favorites`, `/collections`

- Favorite generated image URLs.
- Organize favorites into color-coded collections.
- Rename, filter, and remove collections.

### Browser Image Tools

Routes: `/tools/*`

| Route | Tool |
|-------|------|
| `/tools/background-remover` | Browser-side background removal |
| `/tools/cutout` | Local cutout/masking workflow |
| `/tools/collage` | Multi-image collage builder |
| `/tools/batch` | Resize/compress/convert batch export |
| `/tools/border` | Product border and badge styling |
| `/tools/export` | Platform export presets |
| `/tools/shortcuts` | Keyboard shortcut reference |

### Teams

Routes: `/teams`, `/teams/:id`

- Create teams.
- Join by invite code.
- Manage roles and members.
- Associate generation records with a team.

### Operational Pages

| Route | Purpose |
|-------|---------|
| `/stats` | Generation and favorite statistics |
| `/metrics` | Web vitals and metric summaries |
| `/errors` | Client/server error reporting dashboard |
| `/api-keys` | API key creation and revocation |
| `/competitors` | Manual competitor record tracking |
| `/categories` | Category and template browsing |

### Account and Billing

- Better Auth sign in, sign up, password reset, and profile flows.
- Stripe subscription/webhook integration in the API.
- Pricing page and subscription route scaffolding.

## Platform Settings

Supported target platforms:

- `amazon`
- `shopify`
- `ebay`
- `etsy`
- `generic`

Supported styles:

- `professional`
- `lifestyle`
- `minimal`
- `luxury`

Supported languages are currently driven by UI/API inputs and message files, with English, Chinese, and Japanese present in the frontend message layer.

## Known Product Boundary

The product still exposes image-generation settings because the database/API contract already contains those fields. The current Worker path does not call an image-generation model. Until that pipeline exists, docs and UI copy should avoid promising generated scene images as a production capability.
