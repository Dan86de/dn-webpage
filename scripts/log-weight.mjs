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
const source = readFileSync(file, "utf8");
const [head, list] = source.split(/^entries:\s*$/m);
if (list === undefined) {
  console.error("Could not find an `entries:` list in the file");
  process.exit(1);
}

const entries = new Map();
for (const match of list.matchAll(
  /-\s*date:\s*(\d{4}-\d{2}-\d{2})\s*\n\s*value:\s*([\d.]+)/g,
)) {
  entries.set(match[1], Number(match[2]));
}
const replaced = entries.has(date);
entries.set(date, value);

const body = [...entries.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([d, v]) => `  - date: ${d}\n    value: ${v}`)
  .join("\n");
writeFileSync(file, `${head}entries:\n${body}\n`);
console.log(
  `weight: ${replaced ? "updated" : "logged"} ${value} on ${date} (${entries.size} readings)`,
);
