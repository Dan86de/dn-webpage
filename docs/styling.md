# Styling System

## Fonts (brand guide)

Self-hosted woff2 in `public/fonts/`, declared in `src/styles/typography.css`.

- `--font-display` - Geomanist (400/500/700/900): headings (h1-h6 via base layer), wordmark, buttons
- `--font-sans` - Atkinson Hyperlegible (400/700 + italics, latin + latin-ext): body default
- `--font-mono` - Silka Mono (300/400/500): `caption` utility, mono accents

Atkinson has no 500 weight - `font-medium` on body text silently renders 400.
Use `font-display font-medium` (Geomanist) or `font-bold` instead.

## Tailwind Configuration

- Custom theme defined in `src/styles/global.css` using `@theme` directive
- No traditional tailwind.config file
- Vite plugin integration

## Color System

- Custom OKLCH color system
- Orange brand colors + gray scale
- Automatic dark mode inversion

## Breakpoints

- `tablet`: 550px
- `laptop`: 1100px
- `desktop`: 1500px

## Custom Utility Classes

- `body-large` - Larger body text variant
- `bg-brand-gradient` - Brand gradient background
- `caption` - Caption text style
- `footnote` - Footnote text style

## Layout Patterns ("Every Layout")

Utility classes:

- `stack` - Vertical stacking layout
- `cluster` - Horizontal clustering layout
- `cover` - Cover layout pattern
- `sidebar` - Sidebar layout pattern

## CSS Custom Properties

- `--inline-padding` - Horizontal padding
- `--stack-space` - Vertical spacing
- Additional spacing variables as needed

## Global Styles

Located in `src/styles/`:

- `global.css` - Main entry point, imports reset and typography
- `reset.css` - CSS reset
- `typography.css` - Typography definitions
