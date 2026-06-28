# OuraPix Design Reference

This file records the current frontend design baseline. It should describe the code in `frontend/src/styles/globals.css` and `frontend/src/components`, not an aspirational redesign.

## Visual Direction

- Light-first product workbench inspired by ecommerce photo review, packing labels, and listing proof sheets.
- The primary accent is proof blue for actions and selection states; shipping amber is reserved for workflow labels and warnings.
- The signature visual device is `.proof-strip`, a blue-and-paper diagonal strip used sparingly on hero and generation workbench panels.
- Dense product workflow screens should stay practical: clear navigation, compact controls, readable tables/lists, and predictable action placement.
- Browser-side tools should prioritize direct manipulation and obvious controls over explanatory copy.
- Cards use the shared `.card` utility for real panels, repeated items, and modals. Avoid stacking decorative cards inside other cards.

## Typography

- Display: `Fraunces`, used with restraint for brand-level page titles.
- Body: `Inter`, used for product UI and long-form interface copy.
- Utility: `IBM Plex Mono`, used for labels, proof metadata, and compact status text.

## Theme Tokens

Core tokens are defined in `frontend/src/styles/globals.css`.

| Token | Current Role |
|-------|--------------|
| `--background` | App background |
| `--background-secondary` | Secondary page surfaces |
| `--foreground` | Primary text |
| `--foreground-muted` | Secondary text |
| `--primary` | Primary action and accent |
| `--secondary` | Secondary controls |
| `--border` | Structural separators |
| `--card` | Card and panel surfaces |
| `--ring` | Focus ring |

Semantic colors are exposed as `--color-success`, `--color-warning`, `--color-error`, and `--color-info`.

## Shared Classes

| Class | Purpose |
|-------|---------|
| `.btn-primary` | Primary command button |
| `.btn-secondary` | Secondary command button |
| `.btn-ghost` | Low-emphasis command |
| `.card` | Bordered content surface |
| `.card-hover` | Hover treatment for interactive cards |
| `.input` | Shared text/select input style |
| `.badge` | Compact status/category label |
| `.bench-grid` | Product review grid surface |
| `.proof-strip` | Signature listing/proof sheet stripe |
| `.font-display` | Display face utility |
| `.font-utility` | Metadata and compact label face |
| `.tooltip` | Floating tooltip surface |

## Frontend Structure

```text
frontend/src/
├── components/        React components and feature views
├── components/tools/  Browser-side image tools
├── hooks/             Feature data and interaction hooks
├── layouts/           Astro layouts
├── lib/               API/auth/reporting helpers
├── pages/             Astro routes
├── stores/            Client stores
└── styles/            Global Tailwind/theme CSS
```

## Page Surfaces

| Route Area | Primary Components |
|------------|--------------------|
| Home | `HomePage`, `Navbar`, `Footer` |
| Generate | `Navbar`, `GeneratePage`, `UploadDropzone`, `GenerationProgress`, `CompareView` |
| Pricing | `Navbar`, `PricingPage`, `Footer` |
| Auth | `LoginPage`, `RegisterPage` |
| History/Favorites | `HistoryPage`, `GenerationCard`, `FavoritesPage`, `FavoriteCard` |
| Tools | `BackgroundRemover`, `ImageCutout`, `CollageMaker`, `BatchProcessor`, `ImageBorder`, `ExportDemo`, `ShortcutsDemo` |
| Admin-style views | `MetricsDashboard`, `ErrorsDashboard`, `ApiKeysPage`, `TeamsPage` |

## Interaction Rules

- Prefer icon plus text for primary workflow actions and icon-only buttons for compact tool controls when the icon is familiar.
- Keep text within stable control dimensions; avoid controls changing size when state labels change.
- Use actual product/user content in previews where possible; avoid decorative placeholders for inspection-heavy flows.
- Keep the generation flow organized as upload, specification, and review; do not hide navigation on core workflow pages.
- Pricing and authentication pages should keep the proof-sheet visual language instead of reintroducing generic gradient marketing panels.
- Mobile layouts should collapse to one column without hiding critical commands.
