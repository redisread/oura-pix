# OuraPix Architecture Documentation

## Overview

OuraPix is a full-stack AI-powered application built on the Next.js framework, deployed on Cloudflare Workers edge infrastructure. This document provides a comprehensive overview of the system architecture, design decisions, and technical implementation details.

## Architecture Goals

1. **Edge-First Deployment**: Leverage Cloudflare's global edge network for low-latency responses worldwide
2. **Serverless Scalability**: Handle variable workloads without manual infrastructure management
3. **Type Safety**: Full TypeScript coverage across the entire stack
4. **Developer Experience**: Fast iteration cycles with hot reloading and type-safe database queries
5. **Cost Efficiency**: Pay-per-request model with generous free tiers

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Browser   │  │   Mobile    │  │   Tablet    │  │    Desktop App      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         └─────────────────┴─────────────────┘                    │            │
│                           │                                      │            │
│                    Cloudflare CDN (Static Assets)                │            │
└───────────────────────────┬──────────────────────────────────────┼────────────┘
                            │                                      │
                            ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Edge Layer (Cloudflare Workers)                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         Next.js Application                              │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐ │ │
│  │  │   Pages     │  │    API      │  │   Server    │  │   Middleware   │ │ │
│  │  │  (App Router)│  │   Routes    │  │   Actions   │  │   (Auth/i18n)  │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│  ┌─────────────────────────────────┼─────────────────────────────────────────┐ │
│  │                         Services Layer                                   │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐ │ │
│  │  │    Auth     │  │   Upload    │  │   Generate  │  │    Payment     │ │ │
│  │  │  (Better)   │  │   (R2)      │  │  (Gemini)   │  │   (Stripe)     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Data Layer                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Cloudflare    │  │   Cloudflare    │  │       External APIs         │  │
│  │       D1        │  │       R2        │  │  ┌─────────┐  ┌─────────┐   │  │
│  │   (SQLite)      │  │  (Object Store) │  │  │ Gemini  │  │ Stripe  │   │  │
│  │                 │  │                 │  │  │   AI    │  │   API   │   │  │
│  │  • Users        │  │  • Original     │  │  └─────────┘  └─────────┘   │  │
│  │  • Projects     │  │    Images       │  │                             │  │
│  │  • Generations  │  │  • Generated    │  │                             │  │
│  │  • Payments     │  │    Results      │  │                             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack Deep Dive

### Frontend Architecture

#### Next.js 14+ with App Router

The application uses Next.js App Router for:
- **Server Components**: Default rendering mode for optimal performance
- **Client Components**: Interactive UI elements with `'use client'` directive
- **Server Actions**: Form submissions and mutations without API routes
- **Streaming**: Progressive loading of UI components

```typescript
// Example: Server Component with Server Action
// app/(dashboard)/projects/page.tsx
async function ProjectsPage() {
  const projects = await getUserProjects();

  return (
    <div>
      <ProjectList projects={projects} />
      <CreateProjectForm action={createProjectAction} />
    </div>
  );
}
```

#### State Management

- **Zustand**: Client-side global state for UI state (modals, themes, user preferences)
- **React Server Components**: Server-side data fetching eliminates need for global data stores
- **URL State**: Filter and pagination state synced with URL params

#### Styling Strategy

- **Tailwind CSS v4**: Utility-first CSS for rapid development
- **Shadcn UI**: Headless, accessible component primitives
- **CSS Variables**: Theme customization through CSS custom properties
- **Dark Mode**: next-themes for theme switching

### Backend Architecture

#### Cloudflare Workers Runtime

The application runs on Cloudflare Workers with:
- **Edge Runtime**: V8 isolates for sub-millisecond cold starts
- **Node.js Compatibility**: `nodejs_compat` flag for npm package compatibility
- **Request Handling**: Next.js request/response cycle adapted for Workers

#### Database: Cloudflare D1

D1 is a serverless SQLite database optimized for edge applications:

**Schema Design**:
```typescript
// lib/db/schema.ts
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  credits: integer('credits').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  status: text('status').$type<'pending' | 'processing' | 'completed' | 'failed'>().default('pending'),
  settings: text('settings', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const generations = sqliteTable('generations', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id),
  imageUrl: text('image_url').notNull(),
  prompt: text('prompt'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
```

**Query Patterns**:
```typescript
// lib/db/queries.ts
export async function getUserProjects(userId: string) {
  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.createdAt));
}

export async function createGeneration(data: NewGeneration) {
  return db.insert(generations).values(data).returning();
}
```

#### Storage: Cloudflare R2

R2 provides S3-compatible object storage:

**Storage Structure**:
```
oura-pix-images/
├── uploads/
│   ├── {userId}/
│   │   ├── original/{uuid}.jpg      # User uploaded images
│   │   └── reference/{uuid}.jpg     # Style reference images
├── generated/
│   ├── {projectId}/
│   │   ├── {generationId}-1.jpg     # Generated detail pages
│   │   ├── {generationId}-2.jpg
│   │   └── ...
└── temp/                            # Temporary processing files
```

**Upload Flow**:
1. Client requests presigned URL from `/api/upload/presigned`
2. Client uploads directly to R2 (bypassing server)
3. Server verifies upload and updates database
4. Cleanup job removes orphaned files

### Authentication Architecture

#### Better Auth Integration

Better Auth provides a modern, type-safe authentication solution:

**Configuration**:
```typescript
// lib/auth.ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  database: drizzleAdapter(db),
  providers: {
    google: {
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    },
    github: {
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  },
});
```

**Session Management**:
- HTTP-only cookies for session tokens
- CSRF protection on all mutations
- Automatic session refresh

### AI Generation Pipeline

#### Gemini Banana Integration

The image generation flow:

```
User Upload
    │
    ▼
┌─────────────────┐
│  Image Analysis │  ← Gemini Vision API
│  (Feature Extraction)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Prompt Engineering │  ← Construct optimized prompts
│  (Structure Planning) │    based on product type
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Batch Generation │  ← Gemini Image Generation
│  (5-10 images)    │    Parallel requests
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Post-Processing │  ← Format conversion, optimization
│  (4K upscaling)  │
└────────┬────────┘
         │
         ▼
    R2 Storage
         │
         ▼
    User Dashboard
```

**Generation Service**:
```typescript
// lib/ai/generation.ts
export async function generateProductImages(params: GenerationParams) {
  const { productImage, styleReference, platform, count } = params;

  // 1. Analyze product image
  const analysis = await analyzeProduct(productImage);

  // 2. Generate prompts for each page section
  const prompts = generatePrompts(analysis, platform, count);

  // 3. Generate images in parallel
  const generations = await Promise.all(
    prompts.map(prompt =>
      generateImage({
        prompt,
        referenceImage: styleReference,
        size: PLATFORM_SIZES[platform],
      })
    )
  );

  // 4. Upload to R2 and save to database
  return saveGenerations(generations);
}
```

### Payment System

#### Stripe Integration

**Credit-Based Model**:
- Users purchase credit packages
- Each generation consumes credits
- Credits never expire

**Webhook Handling**:
```typescript
// app/api/stripe/webhook/route.ts
export async function POST(req: Request) {
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get('stripe-signature')!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'checkout.session.completed':
      await fulfillCheckout(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
  }

  return new Response(null, { status: 200 });
}
```

### Internationalization

**next-intl Configuration**:
```typescript
// i18n.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`./messages/${locale}.json`)).default,
}));
```

**Supported Locales**:
- English (en) - Default
- Chinese Simplified (zh)
- Japanese (ja)

## Data Flow

### Image Generation Flow

```
1. User uploads product image
   │
   ├──► Client validates file (type, size)
   │
   ├──► Request presigned URL from API
   │
   ├──► Upload to R2 directly
   │
   └──► Server confirms and creates project record

2. User configures generation settings
   │
   ├──► Select platform (Amazon/Shopify/Custom)
   │
   ├──► Select image count (5-10)
   │
   ├──► Optional: Upload style reference
   │
   └──► Submit generation request

3. Server processes generation
   │
   ├──► Validate user credits
   │
   ├──► Queue generation job
   │
   ├──► AI analyzes product image
   │
   ├──► Generate prompts for each section
   │
   ├──► Call Gemini API (parallel batch)
   │
   ├──► Post-process images
   │
   ├──► Upload results to R2
   │
   └──► Update project status

4. User receives results
   │
   ├──► Real-time status updates (SSE/WebSocket)
   │
   ├──► Download individual images
   │
   └──► Download all as ZIP
```

## Security Considerations

### Authentication & Authorization
- HTTP-only cookies prevent XSS token theft
- CSRF tokens on all state-changing operations
- Row-level security through application-level checks

### File Upload Security
- File type validation (MIME type and magic bytes)
- File size limits (10MB max)
- Virus scanning via Cloudflare Upload API
- Unique filenames prevent path traversal

### API Security
- Rate limiting per user/IP
- Input validation with Zod schemas
- SQL injection prevention via parameterized queries (Drizzle ORM)
- XSS protection through React's automatic escaping

### Payment Security
- Stripe handles all sensitive card data
- Webhook signature verification
- Idempotency keys for payment operations

## Performance Optimization

### Edge Caching
- Static assets cached at Cloudflare CDN
- API responses cached based on cache headers
- Image optimization via Cloudflare Images (optional)

### Database Optimization
- Proper indexing on foreign keys and query columns
- Connection pooling via D1's built-in pooling
- Query result caching for frequently accessed data

### Image Optimization
- WebP format with JPEG fallback
- Responsive images with srcset
- Lazy loading for below-fold images

## Monitoring & Observability

### Logging
- Structured JSON logging
- Request correlation IDs
- Error tracking with stack traces

### Metrics
- Request latency by endpoint
- Generation success/failure rates
- Credit consumption patterns

### Alerting
- Failed generation rate > 5%
- API error rate > 1%
- Database connection failures

## Deployment Architecture

### Environments

```
┌─────────────────────────────────────────────────────────┐
│                      Production                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Workers   │  │     D1      │  │       R2        │  │
│  │  (oura-pix) │  │  (oura-pix-db)  │  │ (oura-pix-images) │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ Promote
┌─────────────────────────────────────────────────────────┐
│                      Staging                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Workers   │  │     D1      │  │       R2        │  │
│  │(oura-pix-stg)│  │(oura-pix-db-stg)│ │(oura-pix-images-stg)│
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ PR Merge
┌─────────────────────────────────────────────────────────┐
│                   Local Development                      │
│              (wrangler dev / next dev)                   │
└─────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

1. **Pull Request**: Run type check, lint, and unit tests
2. **Merge to Main**: Deploy to staging environment
3. **Manual Promotion**: Deploy to production

## Scaling Considerations

### Horizontal Scaling
- Cloudflare Workers automatically scales to handle load
- D1 read replicas for read-heavy workloads (future)
- R2 has no practical storage limits

### Rate Limiting
- Gemini API: 60 requests/minute (adjust based on tier)
- Stripe API: Follow Stripe's rate limits
- Custom rate limiting for user-facing endpoints

### Cost Optimization
- Image compression before storage
- Cleanup of temporary files
- Efficient database queries
- Caching at edge

## Future Enhancements

### Planned Features
1. **Batch Processing Queue**: Durable Objects for large batches
2. **Real-time Updates**: WebSockets for generation progress
3. **A/B Testing**: KV storage for feature flags
4. **Analytics**: Analytics Engine for usage metrics

### Potential Integrations
- **Cloudflare Images**: Automatic optimization and transformation
- **Cloudflare Queue**: Background job processing
- **Cloudflare Durable Objects**: Real-time collaboration

## Development Guidelines

### Code Organization
- Co-locate related files (component, styles, tests)
- Use barrel exports for clean imports
- Maintain strict TypeScript configuration

### Database Migrations
- Always create migrations for schema changes
- Test migrations on staging before production
- Never modify existing migrations after deployment

### Testing Strategy
- Unit tests for utilities and hooks
- Integration tests for API routes
- E2E tests for critical user flows

## Conclusion

OuraPix leverages modern edge computing infrastructure to deliver a fast, scalable, and cost-effective AI image generation service. The architecture prioritizes:

1. **Performance**: Edge deployment minimizes latency
2. **Developer Experience**: Type safety throughout the stack
3. **Maintainability**: Clear separation of concerns
4. **Scalability**: Serverless architecture handles growth

For questions or suggestions regarding this architecture, please open an issue or contact the team.
