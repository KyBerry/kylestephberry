# Portfolio

Personal portfolio: design-engineer brand, dark monochrome theme with a single sage accent.

## Stack

- Next.js 16 (App Router, Turbopack), React 19, TypeScript 6
- Tailwind CSS v4 (CSS-first config via `@theme` in `app/globals.css`)
- content-collections (typed MDX/YAML)
- @next/mdx + rehype-pretty-code + Shiki (Vesper theme) for code
- Radix Dialog for showcase fullscreen + designs lightbox + ⌘K palette
- motion (Framer's successor) for page transitions
- Lenis for smooth scroll
- Pagefind for search
- @vercel/analytics + @vercel/speed-insights

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Build

```bash
pnpm build        # next build + pagefind postbuild
pnpm start        # serve the production build
```

## Tooling

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm format       # prettier --write
pnpm format:check
```

## Content authoring

All content lives in `/content`, validated at build time by content-collections.

### Blog posts

```
content/posts/YYYY-MM-DD-slug.mdx
```

Frontmatter:

```yaml
title: string
summary: string         # ≤ 180 chars
publishedAt: 'YYYY-MM-DD'
updatedAt: 'YYYY-MM-DD' | null
tags: ['react', 'motion']
featured: boolean       # surfaces on /
draft: boolean          # excluded from build when true
heroImage: string | null
heroAlt: string | null
```

Available MDX components (auto-registered):

- `<Callout type="note|warn|tip">`
- `<Showcase slug="hello-button" />` embeds a showcase entry inline
- `<Image src alt width height caption />`
- `<Video src caption />`
- `<Figma url height />`
- `<Tweet id />`
- `<Steps>` / `<Compare before after />`

### Showcase entries

```
content/showcase/<slug>/
  index.mdx          # frontmatter + optional notes
  component.tsx      # default-exported React component
  variants/*.tsx     # optional
```

Frontmatter is similar to posts. The `component.tsx` should `'use client'` and have no required props.

### Figma designs

```
content/designs/<slug>.yaml
public/designs/<slug>.{png,webp}    # 2× from Figma
```

YAML shape: `title`, `summary?`, `image`, `imageAlt`, `imageWidth`, `imageHeight`, `figmaUrl?`, `tags`, `publishedAt`, `featured`.

### Work timeline

`content/work.yaml` (singleton): one `entries[]` array of `{ years, role, company, companyUrl?, context }`.

## Layout & theme

- Theme tokens live in `app/globals.css` inside the `@theme` block, an OKLCH warm-neutral palette plus a single sage accent.
- Container widths come from `--container-prose|grid|hero` tokens; use `<Container variant=…>`.
- The shared `.prose-portfolio` class styles MDX body content (used by both showcase notes and blog posts).

## Deploying

Push to a Vercel-connected branch. The build runs `next build` + `pagefind` postbuild and serves from Vercel's edge. No env vars needed for the current set of features.
