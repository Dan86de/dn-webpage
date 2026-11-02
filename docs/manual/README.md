# danielnoworyta.com manual

What the site does, feature by feature, and what you should see at each step.
A person reads it as the product's checklist; the verify skill reads it as the recipe for a check.

The site is an Astro website with a few React islands, a JSON API backed by Redis, and CLIs that write content into the repository.

## Start from a known state

- Start a run with the verify skill; it prints the run folder and the URL.
- The run has its own copy of the site, so what the steps write stays there, and its store is empty: nobody has smashed or bet.
- Run the doctor before the first step, and require `FIT`.

## Driving conventions

- `drive` is `node .agents/skills/verify/scripts/drive.mjs`, run from the repository root. The [verify skill](../../.agents/skills/verify/SKILL.md) lists its commands.
- Name page elements by role and accessible name, by a field's label, or by visible text.
- Follow a step that writes something with a read of what it wrote.
- Every step and every `Behind it` line is a check; an entry point with no step of its own is not driven.
- Quoted output is how the output starts, or the part of it that matters. Matching ignores case, because captions render uppercase.
- A line that says `not driven` is recorded as a `not driven` check: it stays with the user, and the verdict names it.
- `<today>` is today's date in `Europe/Warsaw`, as `2026-11-02` in a CLI's output and `2 Nov 2026` on a page.
- Start a fresh run per feature file.

## Feature file shape

The feature's name, one paragraph on what a user gets, then in order:

1. `Entry points`: every way a user reaches the feature.
2. `Steps`: the user's action, the command that performs it, and what you should see.
3. `Behind it`: the state the steps leave, and how to read it.
4. `Gotchas`: what wastes a run or makes a check lie.

Only user paths, handles, commands, state and what proves it: no implementation details.

## Features

- [Cheer button](./cheer-button.md): smashing the button on `/habits`, the shared total, and the per-visitor cap.
- [Weekly bet](./weekly-bet.md): placing a slip, the odds, closing, and settling both ways.
- [Habit and weight log](./habit-and-weight-log.md): logging from the CLIs and what the page shows.
- [Writing](./writing.md): from draft to published, the post page, RSS, share images, and what production leaves out.
- [Newsletter sign-up](./newsletter.md): the form on the homepage and under every post, up to the handoff to Kit.
