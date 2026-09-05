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
- `slug` - URL slug

## File Format

Blog posts use markdown format with frontmatter.
Pages live in `src/pages/writing/`; `/blog` and `/blog/[slug]` redirect there (see `astro.config.mjs`).

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
