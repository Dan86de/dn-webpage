---
name: verify
description: Starts this website in an isolated run, drives it in a real browser and through its CLIs, and records whether each check passed in evidence.md. Agents use it on their own before calling a change done, and whenever a change needs proving in the running product.
---

# verify

Prove a change works in the running site.
The primary surface is the website in a browser; the others are its JSON API (`/api/smash`, `/api/bets`), the content CLIs (`pnpm habit|weight|bet|post|post:new`), and the production build.

`drive` below always means `node .agents/skills/verify/scripts/drive.mjs`, run from the repository root.
What to check lives in the feature map, [docs/manual/](../../../docs/manual/README.md): read the feature's file, and turn each step into a check.

## Start

```sh
drive start
```

It prints `run:`, `folder:`, `url:` and `ready:`, and only returns once the server answers and the browser is up.
A first run may download the browser, which takes a minute.

Each run gets `.scratch/verify/<run>/`, where `<run>` is a timestamp plus random characters, holding:

- `site/`: a copy of the working tree, dirty changes included, that the server and the CLIs run from, so nothing they write reaches your tree.
- its own port and an in-memory store: the server gets a clean environment with empty `KV_*` and `UPSTASH_*`, which beats any `.env` file.
- its own empty browser profile, and none of your settings, cookies or Chrome.
- `transcript.log`, `evidence.md`, `shots/`, `server.log`, `driver.log`, `state.json`.

Runs do not touch each other.
With several live, name one by putting `--run <run>` first: `drive --run <run> goto /`.
`drive` only ever talks to the run it started, so never point it, or anything else, at a server on port 4321.

### Out of reach

`drive` refuses these or blocks them, and a run must not get around that:

- Production, `danielnoworyta.com`, and Vercel: no deploys, no `vercel env pull`.
- The real Upstash Redis store, which holds friends' coins. `bet-store-redis.ts` and its Lua scripts cannot be driven: mark a check that depends on them `not driven`.
- Kit: the browser blocks the sign-up request and records it. What Kit does next, the confirmation email and the redirect to `/confirmed`, cannot be driven.
- Anything off the run's origin: the browser blocks every external request (Vercel analytics scripts included) and records it.
- The opti `habits` package, which commits to GitHub, and `git push`.
- `drive run` only executes `pnpm habit|weight|bet|post|post:new|test|build` and `pnpm astro check`.
- Real audio output and real hover devices: the browser is headless.

## Doctor

```sh
drive doctor
```

Read-only.
It checks the server is this run's and answering, that it has no store URL, that the browser driver is alive, and that the working tree has not changed since the run started.
It ends in `FIT` (exit 0) or `UNFIT` (exit 1), with a line for each thing wrong.
After a stop, name the run: `drive --run <run> doctor`.
Run it first, and whenever something looks off.
The site has no sign-in; a bettor is a cookie in the run's browser, and `visitor` switches between them.

## Drive

Handles are roles, accessible names, labels, visible text and routes, never CSS classes.
Names and text match as case-insensitive substrings, and the `caption` style uppercases what it shows, so `text` prints `YOUR SLIP` for `Your slip`, while `see` prints the text as written.

In the browser:

| Command | Does |
| --- | --- |
| `drive goto <path>` | Opens a path on the run's server, waits for `client:load` islands to hydrate. Prints the status and title |
| `drive reload` | Reloads the page |
| `drive click <role> <name> [--times n] [--exact]` | Scrolls to it, waits for its island, clicks |
| `drive fill <label> <value>` | Fills the field with that label |
| `drive hover <role> <name>` | Hovers it |
| `drive press <key>` | Presses a key |
| `drive wait <role> <name>` | Scrolls until it is visible. Use on a heading above a `client:visible` island: the island only hydrates once scrolled to |
| `drive see <text>` | Exits 0 once the text is visible, 1 after 15s |
| `drive absent <text>` | Exits 1 if the text is visible now. It does not wait, so `see` something from the same island first |
| `drive text [<role> <name>]` | Prints the text of it, or of the page |
| `drive snapshot [<role> <name>]` | Prints the accessibility tree of it, or of the page |
| `drive shot <name> [--full]` | Waits a second for animations to land, then saves `shots/<name>.png`. Look at it: Read the file |
| `drive visitor <name>` | Switches to another person, with their own cookies, storage and user agent. The first is `default` |
| `drive viewport <w> <h>` | Resizes the page |
| `drive where` | Prints the visitor and the URL |

Reading back:

| Command | Does |
| --- | --- |
| `drive fetch <METHOD> <path> [<json>] [--grep <regex>]` | Calls the run's server as the current visitor, with their cookie. `--grep` filters by line, and JSON and the RSS feed are one line |
| `drive await-api <METHOD> <path>` | Waits for the page to make that call from now on, up to 15s, and prints it |
| `drive requests` | Lists API calls the pages made, and external requests that were blocked, with bodies |
| `drive console` | Lists browser console errors. Blocked external requests are not in it |
| `drive logs [--grep <regex>]` | Prints the server log |
| `drive read <path> [--grep <regex>]` | Prints a file or lists a folder in the run's `site/` |

In the run's copy of the site:

| Command | Does |
| --- | --- |
| `drive run <command>` | Runs an allowed command in `site/` and waits for the dev server to take in what it wrote |
| `drive edit <path> <old> <new>` | Does what a person does in their editor, once |
| `drive write <path> <content>` | Writes a file |
| `drive restart` | Restarts the server on the same port: needed to see a new post folder. Empties the in-memory store |

A date-dependent step takes the clock from `?now=YYYY-MM-DDTHH:MM`, which works on `/habits` and `/api/bets` on the dev server only.

## Proof bar

- Drive the user's real path: the button in the page, not the endpoint behind it, unless the endpoint is the check.
- Capture the action and the state it led to: a `snapshot`, `text` or `shot` after the step, not just the click.
- Read side effects back: `fetch` after a smash or a bet, `read` after a CLI, `requests` for what left the page.
- Drive every entry point the feature's file lists.
- Look at your screenshots. Something visibly off is a finding, even if it is not what you came for.
- Run `drive console` before recording a feature, and explain every line.
- Fake only what production already puts behind a boundary: the store (memory for Redis), the clock (`?now`), Kit (blocked and recorded).
- Dev is not production: the store is memory, there is no ISR, and drafts show. A claim about production needs `drive run pnpm build` and `drive read` on `.vercel/output/static/`, or it is `not driven`.

## Evidence

`evidence.md` in the run folder holds the commit and branch, whether the tree was dirty, the verdict, and one section per check.
`drive` writes it: do not edit it by hand.
Record each check right after driving it:

```sh
drive check "<heading>" <pass|fail|manual|"not driven"> "<note>"
```

Use the step's bold name as the heading, and `Behind it: <what>` for a `Behind it` line.
The section takes its commands and output from everything run since the last check, and the screenshots they saved.
A check needs commands behind it, unless it is `not driven`.
`check` refuses once the site's sources have changed since the start, because the evidence would be stale, and refuses a heading already recorded: a re-check belongs in a new run.
Edits to `docs/`, `.agents/` and the agent instructions do not count as changing the site.

Each check is:

- `pass`: the product does what the check says.
- `fail`: it does not, and the code is wrong. The note says what happened instead.
- `manual`: it does not, and the map is wrong, because the change meant this, or because the step was never right. The note says why, and the map changes in the same PR.
- `not driven`: it needs something a run cannot reach. The note names it, and the check stays with the user.

The verdict at the top follows from the checks:

- **Done**: every check passed.
- **Done, with n not driven**, naming them.
- **Not done**, naming the failed checks.
- **Done once the map changes in this PR**, naming the `manual` checks.

## Stop

```sh
drive stop
```

It stops the browser and the server by their recorded pids, confirms the doctor says `UNFIT`, and prints the path of `evidence.md`.
The run folder stays, minus its `node_modules`.
Always stop, including after a failure.
