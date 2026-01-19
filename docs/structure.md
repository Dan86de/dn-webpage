# Project Structure

## Directory Organization

```
src/
├── pages/          File-based routing (index.astro, about.astro, blog/[slug].astro)
├── components/     Astro components (includes experience/ subdirectory)
├── layouts/        Layout components
├── content/        Content collections
├── images/         SVG assets and icons
├── styles/         Global CSS files
└── lib/            Utility functions
```

## Key Files

- `src/content.config.ts` - Content collections configuration
- `src/lib/utils.ts` - Shared utilities (cn() function)
- `src/styles/global.css` - Tailwind theme + global styles
