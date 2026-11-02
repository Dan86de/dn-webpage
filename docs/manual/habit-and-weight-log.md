# Habit and weight log

Daniel logs a habit day or a weigh-in from the terminal, and anyone can see it on `/habits`: a yearly grid per habit, and a weight chart against the plan.

## Entry points

- `pnpm habit <id> [YYYY-MM-DD]`, for today by default. The ids are `crossfit`, `football`, `diet`.
- `pnpm weight <value> [YYYY-MM-DD]`, for today by default.
- The `/habits` page, and hovering its weight chart.
- The `Weighing in every morning` line on the homepage.

## Steps

- **See the grids.** Run `drive goto /habits`, then `drive snapshot img "CrossFit"`.
  The name reads `CrossFit / Gym: <n> days in the last year`, and the months run along it. Note `<n>`.
- **Log a habit.** Run `drive run pnpm habit crossfit <a day this year not yet logged>`.
  It prints `crossfit: logged`, and `drive read src/content/habits/crossfit.yaml --grep <that day>` prints it.
- **See it counted.** Run `drive goto /habits`, then `drive snapshot img "CrossFit"`.
  The name now reads `<n + 1> days in the last year`.
- **Log it again.** Run the same `pnpm habit` again.
  It prints `is already logged`, and the file is unchanged.
- **Refuse an unknown habit.** Run `drive run pnpm habit nope`.
  It exits 1 with `No habit file at src/content/habits/nope.yaml`.
- **Refuse a bad weight.** Run `drive run pnpm weight abc`.
  It exits 1 with `Usage: pnpm weight <value> [YYYY-MM-DD]`.
- **Weigh in.** Run `drive run pnpm weight 100.5`.
  It prints `weight:` and `100.5 on <today>`, and `drive read src/content/weight/log.yaml --grep 100.5` prints `value: 100.5`.
- **See the chart.** Run `drive goto /habits`, `drive wait heading "Weight"`, then `drive snapshot img "Weight over time"`.
  The name reads `Weight over time, 111.4 to 100.5 kg, projected to reach 94 kg around`, and `drive see "100.5"` passes.
- **Scrub the chart.** Run `drive see "Current"`, `drive hover img "Weight over time"`, then `drive absent "Current"`.
  The label over the reading changes to the date under the pointer. `drive shot weight`, and look at it.
- **See it on the homepage.** Run `drive goto /`, then `drive see "100.5 kg today"`.

## Behind it

Each log is a line in its YAML file under `src/content/` and nothing else changes: the comments and the other days stay.
Run `drive read src/content/weight/log.yaml --grep "projection|goal"` to see the plan still there.

## Gotchas

- The weight chart hydrates when scrolled to: `drive wait heading "Weight"` first, or the readout is not there.
- A far-future weight stretches the chart's axis and makes it unreadable: log today's.
- `Log a habit` needs a date the file does not have and that falls in the last year: the file changes every day, so read it first.
- A CLI's write reloads an open page: `drive run` waits for that, so go on with the next step directly.
