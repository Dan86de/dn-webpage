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

// Rewrite only the `days:` block, line by line, so the comments and metadata
// above it survive untouched. A habit with no days yet is written as the flow
// form `days: []`, so match that too.
const lines = readFileSync(file, "utf8").split("\n");
const start = lines.findIndex((line) => /^days:/.test(line));
if (start === -1) {
  console.error("Could not find a `days:` list in the file");
  process.exit(1);
}

let end = start + 1;
while (end < lines.length && /^\s+-\s/.test(lines[end])) end++;

const days = new Set(
  lines.slice(start, end).join("\n").match(/\d{4}-\d{2}-\d{2}/g) ?? [],
);
if (days.has(date)) {
  console.log(`${habit}: ${date} is already logged`);
  process.exit(0);
}

days.add(date);
const body = [...days].sort().map((d) => `  - ${d}`);
writeFileSync(
  file,
  [...lines.slice(0, start), "days:", ...body, ...lines.slice(end)].join("\n"),
);
console.log(`${habit}: logged ${date} (${days.size} days total)`);
