#!/usr/bin/env node
// Set a week's bet: `pnpm bet <habit> <target> "<question>" <YYYY-MM-DDTHH:MM> [--force]`.
// Writes src/content/bets/<monday>.yaml for the week of the due date (Warsaw
// local time). The opti `habits` package does the same by committing to GitHub.
import { existsSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const force = args.includes("--force");
const [habit, targetArg, question, due] = args.filter((arg) => arg !== "--force");

if (!habit || !targetArg || !question || !due) {
  console.error('Usage: pnpm bet <habit> <target> "<question>" <YYYY-MM-DDTHH:MM> [--force]');
  process.exit(1);
}

if (!existsSync(new URL(`../src/content/habits/${habit}.yaml`, import.meta.url))) {
  console.error(`No habit file at src/content/habits/${habit}.yaml`);
  process.exit(1);
}

const target = Number(targetArg);
if (!Number.isInteger(target) || target < 1) {
  console.error(`Invalid target "${targetArg}", expected a whole number of days`);
  process.exit(1);
}

if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(due)) {
  console.error(`Invalid due "${due}", expected YYYY-MM-DDTHH:MM in Warsaw time`);
  process.exit(1);
}

// The Monday of the due date's week names the file: one bet per week.
const dueDay = new Date(`${due.slice(0, 10)}T00:00:00Z`);
const monday = new Date(dueDay.getTime() - ((dueDay.getUTCDay() + 6) % 7) * 86_400_000)
  .toISOString()
  .slice(0, 10);

const file = new URL(`../src/content/bets/${monday}.yaml`, import.meta.url);
if (existsSync(file) && !force) {
  console.error(
    `There is already a bet for the week of ${monday}. Pass --force to replace it ` +
      "(slips already placed stay on it, now under the new terms).",
  );
  process.exit(1);
}

// JSON strings are valid double-quoted YAML, so any question survives.
writeFileSync(
  file,
  [
    `habit: ${habit}`,
    `target: ${target}`,
    `question: ${JSON.stringify(question)}`,
    `due: ${JSON.stringify(due)}`,
    "",
  ].join("\n"),
);
console.log(`Bet for the week of ${monday}: ${question} (${habit}, ${target} by ${due})`);
