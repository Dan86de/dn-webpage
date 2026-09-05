#!/usr/bin/env node
// Log a weight reading: `pnpm weight <value> [YYYY-MM-DD]`. Defaults to today.
import { readFileSync, writeFileSync } from "node:fs";

const [valueArg, dateArg] = process.argv.slice(2);
const value = Number(valueArg);
if (!valueArg || Number.isNaN(value) || value <= 0) {
  console.error("Usage: pnpm weight <value> [YYYY-MM-DD]");
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

const file = new URL("../src/content/weight/log.yaml", import.meta.url);
// Rewrite only the `entries:` block, line by line, so the comments and the
// projection config elsewhere in the file survive untouched.
const lines = readFileSync(file, "utf8").split("\n");
const start = lines.findIndex((line) => /^entries:/.test(line));
if (start === -1) {
  console.error("Could not find an `entries:` list in the file");
  process.exit(1);
}

let end = start + 1;
while (end < lines.length && /^\s+\S/.test(lines[end])) end++;

const entries = new Map();
for (const match of lines
  .slice(start, end)
  .join("\n")
  .matchAll(/-\s*date:\s*(\d{4}-\d{2}-\d{2})\s*\n\s*value:\s*([\d.]+)/g)) {
  entries.set(match[1], Number(match[2]));
}
const replaced = entries.has(date);
entries.set(date, value);

const body = [...entries.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([d, v]) => `  - date: ${d}\n    value: ${v}`);
writeFileSync(
  file,
  [...lines.slice(0, start), "entries:", ...body, ...lines.slice(end)].join("\n"),
);
console.log(
  `weight: ${replaced ? "updated" : "logged"} ${value} on ${date} (${entries.size} readings)`,
);
