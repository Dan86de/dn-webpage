# Styling System

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
