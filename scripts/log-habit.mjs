#!/usr/bin/env node
// Log a habit day: `pnpm habit <habit> [YYYY-MM-DD]`. Defaults to today.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const [habit, dateArg] = process.argv.slice(2);
if (!habit) {
  console.error("Usage: pnpm habit <habit> [YYYY-MM-DD]");
  process.exit(1);
}

const file = new URL(`../src/content/habits/${habit}.yaml`, import.meta.url);
if (!existsSync(file)) {
  console.error(`No habit file at src/content/habits/${habit}.yaml`);
  process.exit(1);
}

const date =
  dateArg ??
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(
    new Date(),
  );
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`Invalid date "${date}", expected YYYY-MM-DD`);
  process.exit(1);
}

const source = readFileSync(file, "utf8");
const [head, list] = source.split(/^days:\s*$/m);
if (list === undefined) {
  console.error("Could not find a `days:` list in the file");
  process.exit(1);
}

const days = new Set(list.match(/\d{4}-\d{2}-\d{2}/g) ?? []);
if (days.has(date)) {
  console.log(`${habit}: ${date} is already logged`);
  process.exit(0);
}

days.add(date);
const body = [...days]
  .sort()
  .map((d) => `  - ${d}`)
  .join("\n");
writeFileSync(file, `${head}days:\n${body}\n`);
console.log(`${habit}: logged ${date} (${days.size} days total)`);
