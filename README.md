# danielnoworyta.com

Personal website and blog of Daniel Noworyta, built with Astro and deployed on Vercel.

## Stack

- [Astro 7](https://astro.build) with the Vercel adapter (ISR enabled)
- [Tailwind CSS 4](https://tailwindcss.com) via the Vite plugin, themed inline in `src/styles/global.css`
- React 19 for interactive islands
- MDX for blog content, plus RSS and sitemap generation

## Getting started

Requires Node.js 22 (the runtime used by Vercel) and pnpm.

```sh
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:4321`.

## Commands

| Command            | Action                                     |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Start the development server               |
| `pnpm build`       | Build the production site into `dist/`     |
| `pnpm preview`     | Preview the production build locally       |
| `pnpm astro check` | Type-check `.astro` and TypeScript sources |
| `pnpm habit <name> [date]` | Log a habit day (defaults to today), e.g. `pnpm habit crossfit` |
| `pnpm weight <value> [date]` | Log a weight reading (defaults to today), e.g. `pnpm weight 84.3` |

## Project structure

```text
src/
├── pages/          File-based routes (index, about, experience, uses, habits, blog/)
├── components/     Astro and React components
├── layouts/        Page and blog post layouts
├── content/blog/   Blog posts (Markdown / MDX with frontmatter)
├── content/habits/ Habit logs (one YAML file per habit)
├── content/weight/ Weight log (log.yaml)
├── styles/         Global CSS, reset, typography, Tailwind theme
├── images/         SVG and image assets
└── lib/            Shared utilities
public/
├── fonts/          Self-hosted web fonts
└── favicon-*.ico   Light and dark favicons
```

## Writing a blog post

Add a folder under `src/content/blog/<slug>/` containing `<slug>.md` (or `.mdx`).
The frontmatter schema is defined in `src/content.config.ts`.
Posts with `isDraft: true` are excluded from the published site.

## Documentation

Detailed notes on the styling system, content collections, components, and structure live in `docs/`.
`AGENTS.md` links them together for coding agents.
