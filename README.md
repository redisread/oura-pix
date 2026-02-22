# OuraPix

<p align="center">
  <img src="public/logo.svg" alt="OuraPix Logo" width="120" />
</p>

<p align="center">
  <strong>AI-Powered Cross-Border E-commerce Product Detail Page Generator</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#architecture">Architecture</a>
</p>

---

## Features

OuraPix is a minimalist AI-powered tool designed for cross-border e-commerce sellers to generate professional product detail pages effortlessly.

### Core Capabilities

- **Smart Product Analysis**: Upload your product main image and let AI automatically analyze features, selling points, and optimal page structure
- **Batch Image Generation**: Generate 5-10 high-quality e-commerce detail images in one click
- **Style Reference Support**: Optionally upload style reference images to maintain brand consistency
- **Platform-Optimized Sizes**: Built-in presets for Amazon, Shopify, and other major platforms
- **4K HD Output**: Crystal clear images ready for professional use

### Supported Platforms

| Platform | Dimensions | Status |
|----------|-----------|--------|
| Amazon | 2000x2000px | Supported |
| Shopify | 2048x2048px | Supported |
| eBay | 1600x1600px | Supported |
| Custom | Flexible | Supported |

## Tech Stack

### Frontend
- **Framework**: [Next.js 14+](https://nextjs.org/) with App Router
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)

### Backend
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)

### AI & APIs
- **Image Generation**: Google Gemini Banana
- **Payments**: [Stripe](https://stripe.com/)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Cloudflare account
- Stripe account (for payments)
- Google AI Studio account (for Gemini API)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/oura-pix.git
   cd oura-pix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration values.

4. **Set up the database**
   ```bash
   # Create D1 database (run once)
   wrangler d1 create oura-pix-db

   # Generate migrations
   npm run db:generate

   # Apply migrations locally
   npm run db:migrate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `AUTH_SECRET` - Better Auth secret (generate with `openssl rand -base64 32`)
- `GEMINI_API_KEY` - Google Gemini API key
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

## Deployment

### Deploy to Cloudflare Workers

1. **Build the application**
   ```bash
   npm run cf:build
   ```

2. **Deploy to production**
   ```bash
   npm run cf:deploy
   ```

   Or use Wrangler directly:
   ```bash
   wrangler deploy
   ```

### Database Migrations in Production

```bash
wrangler d1 migrations apply oura-pix-db --remote
```

### Setting Secrets

```bash
# Set authentication secret
wrangler secret put AUTH_SECRET

# Set Gemini API key
wrangler secret put GEMINI_API_KEY

# Set Stripe keys
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
```

## Project Structure

```
oura-pix/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth routes group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Dashboard routes group
│   │   ├── dashboard/
│   │   ├── projects/
│   │   └── settings/
│   ├── api/                 # API routes
│   │   ├── auth/           # Better Auth endpoints
│   │   ├── generate/       # AI generation API
│   │   ├── stripe/         # Payment webhooks
│   │   └── upload/         # Image upload handlers
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/              # React components
│   ├── ui/                 # Shadcn UI components
│   ├── auth/               # Authentication components
│   ├── generate/           # Generation workflow components
│   └── layout/             # Layout components
├── lib/                     # Utility libraries
│   ├── auth.ts             # Better Auth configuration
│   ├── db/                 # Database configuration
│   │   ├── schema.ts       # Drizzle schema
│   │   └── index.ts        # Database client
│   ├── stripe.ts           # Stripe configuration
│   └── utils.ts            # Helper utilities
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript type definitions
├── public/                  # Static assets
├── styles/                  # Global styles
├── messages/                # i18n translation files
│   ├── en.json
│   ├── zh.json
│   └── ja.json
├── drizzle.config.ts        # Drizzle ORM configuration
├── next.config.js           # Next.js configuration
├── wrangler.toml            # Cloudflare Workers configuration
└── package.json
```

## Architecture

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- Documentation: [https://docs.oura-pix.com](https://docs.oura-pix.com)
- Issues: [GitHub Issues](https://github.com/yourusername/oura-pix/issues)
- Email: support@oura-pix.com

---

<p align="center">
  Built with ❤️ for cross-border e-commerce sellers
</p>
