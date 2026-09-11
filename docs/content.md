# Content Collections

## Blog Collection (rendered at `/writing`)

**Location**: `src/content/blog/**/*.md`

**Configuration**: `src/content.config.ts` using glob loader

**Schema**:
- `title` - Post title
- `author` - Author name
- `tags` - Post tags
- `publishDate` - Publication date
- `isDraft` - Draft status
- `authorContact` - Author contact info
- `canonicalURL` - Optional. Defaults to `/writing/<slug>` on the site; the site is the source
- `alsoPublishedOn` - Optional list of `{ name, url }` places the piece was syndicated to, linked from the post footer
- `category` - `issue` (the weekly letter) or `essay` (longer pieces). Defaults to `essay`
- `slug` - URL slug

## File Format

Blog posts use markdown format with frontmatter.
Pages live in `src/pages/writing/`; `/blog` and `/blog/[slug]` redirect there (see `astro.config.mjs`).
`/writing`, `/writing/issues` and `/writing/essays` are static pages rendered by `src/components/WritingIndex.astro`; the tag filter is gone, tags only feed RSS categories and JSON-LD keywords.

**Issue numbers**: issues are numbered in publish order by `withIssueNumbers()` in `src/lib/posts.ts` ("Issue #3"), so backdating a new issue before an existing one renumbers the later ones.
Essays are labelled "Essay" and never numbered.
The helpers in `src/lib/posts.ts` are the one place that decides which posts are visible (`getVisiblePosts` shows drafts on the dev server, `getPublishedPosts` never does) and which posts neighbour each other.

**Post footer**: every post ends with the newsletter form (`src/components/NewsletterForm.astro`, shared with the homepage) and previous / next links.
The table of contents marks the last heading active once the page is scrolled to the bottom, so the post needs no extra padding below it.

**RSS**: `/rss.xml` carries the full rendered HTML of each post (`post.rendered.html`, so `.md` only), with root-relative links made absolute.

**Writing**: `pnpm post:new "Title" [--category issue|essay]` scaffolds a draft from `scripts/templates/issue.md` (the three ingredients as comments, `isDraft: true`).
`pnpm post <file> [--date YYYY-MM-DD] [--slug slug] [--force]` publishes it: a draft inside the collection gets `isDraft: false` and today's date; a file from anywhere else (an Obsidian note) is copied in with title from the frontmatter or first H1, description from the frontmatter or first paragraph, tags from the frontmatter.
Drafts (`isDraft: true`) are listed with a Draft badge on the dev server only; production and RSS never show them.
The dev server does not notice a brand-new post folder until restarted.
Template comments are stripped on publish. Relative image links are warned about, never fixed.
`category` is `issue` for the weekly letter and `essay` for longer pieces.
Code blocks are highlighted with both `github-light` and `github-dark` and follow the site's theme toggle (CSS in `src/layouts/BlogPostLayout.astro`).

**Share images**: every post gets `/og/<slug>.png` (1200x630), rendered at build time by `src/og/render.ts` with satori and resvg from the post title, in the same design as `public/og-default.jpg`.
The fonts satori needs are TTF copies of the brand woff2 files in `src/og/fonts/` and the photo is `src/og/avatar.jpg`; none of them are served.
A post with `image` in its frontmatter uses that instead.
Facebook and LinkedIn cache the first scrape of a URL, so after changing an image re-scrape it in their debuggers.

## Habits Collection

**Location**: `src/content/habits/*.yaml` (one file per habit, file name is the habit id)

**Schema**:
- `name` - Display name
- `description` - One-line rule for the habit
- `order` - Sort order on the page
- `weeklyTarget` - Optional sessions per week; when set the page shows weekly progress instead of day streaks
- `days` - List of `YYYY-MM-DD` dates the habit was done (deduplicated and sorted by the schema)

**Logging**: `pnpm habit <id> [YYYY-MM-DD]` appends a day to the file.
Days are rendered by `src/components/HabitGrid.astro` as a rolling 53-week grid with streak stats.
"Today" is computed in `Europe/Warsaw` (see `src/lib/habits.ts`).

## Bets Collection

**Location**: `src/content/bets/<monday>.yaml` (one file per week, named after that week's Monday, so one bet a week)

**Schema**:
- `habit` - A habit id from `src/content/habits`
- `target` - Days logged from Monday to the due date that make it a "yes"
- `question` - What the page asks, e.g. "Two sessions by Sunday?"
- `due` - Quoted local Warsaw time `"YYYY-MM-DDTHH:MM"`, inside the file's week; betting closes then

**Setting**: the opti `habits` package's `bet()` commits the file, or locally `pnpm bet <habit> <target> "<question>" <YYYY-MM-DDTHH:MM>` (`--force` replaces a week's bet).
A week without a file has no bet. A file that fails the rules in `betProblem()` is skipped with a warning.

**Settling**: the log settles it (`src/lib/betting.ts`): "yes" as soon as the target is hit, "no" at noon the day after `due`, so a late-logged session still counts.
Only the money lives outside git: players, slips and pools are in Upstash Redis behind `/api/bets` (`src/lib/bet-store*.ts`), settled lazily on each request, and a recorded outcome is final.
Rendered by `src/components/betting/` (the weekly bet, the slip, the friends table).
On the dev server `/habits?now=YYYY-MM-DDTHH:MM` fakes the clock to walk a bet through closing and settling.

## Weight Collection

**Location**: `src/content/weight/log.yaml` (a single file)

**Schema**:
- `unit` - `kg` or `lb`
- `entries` - List of `{ date, value }` readings, one per day (later duplicates win, sorted by date)
- `projection` - Optional goal projection: `goal`, `intake` (daily kcal cap), `burn` (two `{ weight, kcal }` anchors the daily burn is interpolated between), `adherence` (share of the modelled deficit actually hit, in (0, 1])

**Logging**: `pnpm weight <value> [YYYY-MM-DD]` adds or replaces a reading.
Rendered by `src/components/WeightChart.tsx`, a React island with a spring-driven clip-path reveal on hover.
The projection (`src/lib/weight.ts`) walks day by day from the first reading, losing `adherence * (burn - intake) / 7700` kg per day until it hits the goal.
It is a fixed target line, so the gap between it and the latest reading shows whether the plan is ahead or behind.
