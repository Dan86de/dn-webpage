#!/usr/bin/env node
// Set a week's bet:
//   pnpm bet <habit> <target> "<question>" <YYYY-MM-DDTHH:MM> [--from YYYY-MM-DD] [--force]
// Writes src/content/bets/<monday>.yaml for the week of the due date (Warsaw
// local time). --from makes a later day the first that counts, e.g. the
// Saturday of a weekend bet. The opti `habits` package does the same by
// committing to GitHub.
import { existsSync, writeFileSync } from "node:fs";

const argv = process.argv.slice(2);
const force = argv.includes("--force");
const fromAt = argv.indexOf("--from");
const from = fromAt === -1 ? undefined : argv[fromAt + 1];
const positional = argv.filter(
  (arg, i) => arg !== "--force" && i !== fromAt && i !== fromAt + 1,
);
const [habit, targetArg, question, due] = positional;

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

if (!habit || !targetArg || !question || !due) {
  fail(
    'Usage: pnpm bet <habit> <target> "<question>" <YYYY-MM-DDTHH:MM> [--from YYYY-MM-DD] [--force]',
  );
}

if (!existsSync(new URL(`../src/content/habits/${habit}.yaml`, import.meta.url))) {
  fail(`No habit file at src/content/habits/${habit}.yaml`);
}

const target = Number(targetArg);
if (!Number.isInteger(target) || target < 1) {
  fail(`Invalid target "${targetArg}", expected a whole number of days`);
}

if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(due)) {
  fail(`Invalid due "${due}", expected YYYY-MM-DDTHH:MM in Warsaw time`);
}

const DAY_MS = 86_400_000;
const utc = (day) => new Date(`${day}T00:00:00Z`).getTime();
const mondayOf = (day) =>
  new Date(utc(day) - ((new Date(utc(day)).getUTCDay() + 6) % 7) * DAY_MS)
    .toISOString()
    .slice(0, 10);

// The Monday of the due date's week names the file: one bet per week.
const dueDay = due.slice(0, 10);
const monday = mondayOf(dueDay);
const first = from ?? monday;

if (from !== undefined) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || mondayOf(from) !== monday) {
    fail(`Invalid --from "${from}", expected a day in the week of ${monday}`);
  }
  if (from > dueDay) fail(`--from ${from} is after the due date ${due}`);
}

const available = (utc(dueDay) - utc(first)) / DAY_MS + 1;
if (target > available) {
  fail(`A target of ${target} cannot be hit: only ${available} day(s) from ${first} to ${dueDay} count.`);
}

const file = new URL(`../src/content/bets/${monday}.yaml`, import.meta.url);
if (existsSync(file) && !force) {
  fail(
    `There is already a bet for the week of ${monday}. Pass --force to replace it ` +
      "(slips already placed stay on it, now under the new terms).",
  );
}

// JSON strings are valid double-quoted YAML, so any question survives.
writeFileSync(
  file,
  [
    `habit: ${habit}`,
    `target: ${target}`,
    `question: ${JSON.stringify(question)}`,
    ...(from ? [`from: ${JSON.stringify(from)}`] : []),
    `due: ${JSON.stringify(due)}`,
    "",
  ].join("\n"),
);
console.log(
  `Bet for the week of ${monday}: ${question} (${habit}, ${target} from ${first} by ${due})`,
);
