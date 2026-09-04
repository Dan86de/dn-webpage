# Content Collections

## Blog Collection

**Location**: `src/content/blog/**/*.md`

**Configuration**: `src/content.config.ts` using glob loader

**Schema**:
- `title` - Post title
- `author` - Author name
- `tags` - Post tags
- `publishDate` - Publication date
- `isDraft` - Draft status
- `authorContact` - Author contact info
- `canonicalURL` - Canonical URL
- `slug` - URL slug

## File Format

Blog posts use markdown format with frontmatter.

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

**Logging**: `pnpm weight <value> [YYYY-MM-DD]` adds or replaces a reading.
Rendered by `src/components/WeightChart.tsx`, a React island with a spring-driven clip-path reveal on hover.
