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

### SmashButton

The cheer button on `/habits` (`src/components/SmashButton.tsx`), a React island.

A desk buzzer drawn as stacked SVG ellipses: the housing is a cylinder (two
caps plus a side wall, all sharing one squash ratio so they read at a single
viewing angle), and the dome is an arc over its own rim. Press timing follows
Josh Comeau's 3D button - the dome sinks in 34ms and returns over 250-600ms on
an overshooting bezier, because a symmetric curve does not feel physical. Each
hit stamps a comic burst balloon (`SMASH!` / `POW!` / ...) that slams in
oversized and snaps down, one short-lived element per hit so rapid smashing
overlaps rather than restarting.

Counts are optimistic and flushed to `/api/smash` on a 700ms debounce, with
`sendBeacon` on `pagehide` so a smash is not lost to a navigation. A visitor
can add at most 16, enforced server-side against a hashed visitor key so
clearing localStorage does not reset the cap.

**Storage**: `src/lib/smash.ts` talks to Upstash Redis over its REST API (no
client library, no TCP pool to leak across cold starts). It reads
`KV_REST_API_URL` / `KV_REST_API_TOKEN`, falling back to the `UPSTASH_*` names.
With neither set it uses an in-memory counter, so local dev works unconfigured.
Pull the real values with `vercel env pull .env.development.local`.

`/api/smash` sets `prerender = false` and is excluded from ISR in
`astro.config.mjs`; served through ISR its response would be cached for the life
of the deployment and the total would freeze.

### Sound

`src/lib/sound.ts` (`createSound`) plays one-shot effects over the Web Audio
API: decode once, start a fresh source node per hit so they overlap, and resume
the context on play (browsers start it suspended, and without the resume the
first sound of a session is swallowed). `slices` splits one file into N equal
slots and plays a different one each hit - `public/audio/smash-hits.mp3` packs
four cartoon impacts at 300ms each. Used by SmashButton and ThemeToggle.

## Utilities

**File**: `src/lib/utils.ts`

Exports `cn()` function for Tailwind class merging (combines clsx + tailwind-merge).
