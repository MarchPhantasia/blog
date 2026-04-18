# blog

Personal blog built with [Astro](https://astro.build), deployed to Cloudflare Pages.

## Local development

```bash
pnpm install
pnpm dev          # http://localhost:4321
```

## Build

```bash
pnpm build        # outputs to dist/
pnpm preview      # preview the production build locally
```

## Deploy

Manual deploy to Cloudflare Pages (requires `CLOUDFLARE_API_TOKEN` in env):

```bash
pnpm build
wrangler pages deploy dist --project-name blog-marchphantasia --branch main
```

Live at <https://blog-marchphantasia.pages.dev>.

## Project layout

- `src/pages/` — route files
- `src/layouts/` — page layouts (TBD)
- `src/components/` — reusable components (TBD)
- `public/` — static assets served as-is
- `docs/superpowers/` — design specs and implementation plans
