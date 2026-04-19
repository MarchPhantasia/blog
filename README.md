# blog

Personal blog built with [Astro](https://astro.build) + Tailwind v4, deployed to Cloudflare Pages.

**Live:** <https://blog-marchphantasia.pages.dev>

## Stack

- Astro 6 (static output, content collections)
- Tailwind v4 via `@tailwindcss/vite` + `@tailwindcss/typography`
- Markdown posts with Shiki dual-theme code highlighting
- Dark mode (CSS class + `prefers-color-scheme`)
- RSS + sitemap (official integrations)

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

## Writing a post

Put a Markdown file in `src/content/posts/`:

```markdown
---
title: 文章标题
description: 一句描述
pubDate: 2026-04-19
tags:
  - 技术
  - 随笔
draft: false
---

正文……
```

Frontmatter schema is enforced by `src/content.config.ts`. `draft: true` hides the post in production builds.

## Project layout

```
src/
├── config/site.ts          # 站点配置（作者、导航、社交链接）
├── content.config.ts       # 内容集合 schema
├── content/posts/          # Markdown 文章
├── layouts/                # BaseLayout, PostLayout
├── components/             # Site chrome + 卡片 / 元信息 / 主题切换等
├── pages/                  # 路由：首页 / posts / tags / about / rss / 404
├── lib/                    # reading-time, 日期格式化
└── styles/global.css       # Tailwind 指令 + CSS 变量 + prose 覆写
public/                     # 静态资源（favicon、og-default）
docs/superpowers/           # 设计文档与实施计划
```

## Customizing

改动都可以集中在 `src/config/site.ts`（站名、作者、slogan、bio、导航、社交）与 `src/styles/global.css`（主题色、字体栈）。
