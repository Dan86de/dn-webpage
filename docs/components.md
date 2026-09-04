# Component Architecture

## Base Layout

**File**: `src/layouts/Layout.astro`

Includes:
- Header and navigation
- Theme toggle with client-side persistence
- Dynamic favicon switching (favicon-light.ico / favicon-dark.ico)

### Theme Toggle Implementation

- Inline script for immediate theme application
- Uses `localStorage` for persistence
- Adds/removes `dark` class on `documentElement`

## Custom Components

### PixelCard

Canvas-based component with pixel animation on hover/focus states.

### HeroBackground

Pure CSS decorative background for the homepage hero, no JS or images.
`variant="dots"` renders a masked dot grid; `variant="glow"` adds two slow-drifting brand glows animated via `transform` only.

## Utilities

**File**: `src/lib/utils.ts`

Exports `cn()` function for Tailwind class merging (combines clsx + tailwind-merge).
