# Project Overview

Astro 7 website with Tailwind CSS 4, deployed to Vercel with ISR.

## Commands

- `npm run dev` - Development server (localhost:4321)
- `npm run build` - Production build
- `npm run astro` - Astro CLI (add, check)

## Key Info

- TypeScript path alias: `@/*` → `src/*`
- Tailwind config: Inline `@theme` in `src/styles/global.css` (no config file)

## Verifying a change

Use the `verify` skill (`.agents/skills/verify/`) to prove a change in the running site.
A change the feature map (`docs/manual/`) describes is done only when a verify run's `evidence.md` has no failed check, and the map changes in the same PR as the behaviour.

## Detailed Docs

- Styling System @docs/styling.md - Tailwind theme, colors, breakpoints, utilities
- Content @docs/content.md - Blog collections, schemas
- Components @docs/components.md - Layout patterns, theme toggle
- Project Structure @docs/structure.md - Directory organization
