# OuraPix Design Reference

This file records the current frontend design baseline. It should describe the code in `frontend/src/styles/globals.css` and `frontend/src/components`, not an aspirational redesign.

## Visual Direction

- Dark-first interface with restrained purple accents.
- Dense product workflow screens should stay practical: clear navigation, compact controls, readable tables/lists, and predictable action placement.
- Browser-side tools should prioritize direct manipulation and obvious controls over explanatory copy.
- Cards use the shared `.card` utility. Avoid stacking decorative cards inside other cards.

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
| Generate | `GeneratePage`, `UploadDropzone`, `GenerationProgress`, `CompareView` |
| History/Favorites | `HistoryPage`, `GenerationCard`, `FavoritesPage`, `FavoriteCard` |
| Tools | `BackgroundRemover`, `ImageCutout`, `CollageMaker`, `BatchProcessor`, `ImageBorder`, `ExportDemo`, `ShortcutsDemo` |
| Admin-style views | `MetricsDashboard`, `ErrorsDashboard`, `ApiKeysPage`, `TeamsPage` |

## Interaction Rules

- Prefer icon plus text for primary workflow actions and icon-only buttons for compact tool controls when the icon is familiar.
- Keep text within stable control dimensions; avoid controls changing size when state labels change.
- Use actual product/user content in previews where possible; avoid decorative placeholders for inspection-heavy flows.
- Mobile layouts should collapse to one column without hiding critical commands.
