# Weekly bets

One bet per week on `/habits`, one file per bet.
The file is named after the Monday of its week, e.g. `2026-09-07.yaml`, which is what keeps it to one bet a week.

```yaml
habit: crossfit # a file name in src/content/habits
target: 2 # days logged from Monday to the due date that make it a "yes"
question: Two sessions by Sunday?
due: "2026-09-13T20:00" # local Warsaw time, quoted
```

Betting closes at `due`.
The bet settles "yes" the moment the log hits the target, and "no" at noon the day after `due`, so a session logged late still counts.
A week without a file has no bet.

Set one with the opti `habits` package (`bet(...)`), or locally with `pnpm bet <habit> <target> "<question>" <YYYY-MM-DDTHH:MM>`.
