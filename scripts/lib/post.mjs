// Shared helpers for the post scripts.
import { parse, stringify } from "yaml";

export const BLOG_DIR = new URL("../../src/content/blog/", import.meta.url);

export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Warsaw" }).format(
    new Date(),
  );
}

export function isISODate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Split a markdown file into { data, body }. Missing frontmatter gives {}. */
export function splitFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: source };
  return { data: parse(match[1]) ?? {}, body: source.slice(match[0].length) };
}

export function joinFrontmatter(data, body) {
  return `---\n${stringify(data, { lineWidth: 0 })}---\n\n${body.replace(/^\s+/, "")}`;
}

/** Parse `--flag value` and `--flag` pairs; positionals go to `_`. */
export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) args[key] = true;
    else args[key] = argv[++i];
  }
  return args;
}

export function fail(message) {
  console.error(message);
  process.exit(1);
}
