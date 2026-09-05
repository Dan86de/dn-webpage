#!/usr/bin/env node
// Scaffold a draft from the issue template:
//   pnpm post:new "Title" [--category issue|essay] [--slug custom-slug]
// Writes src/content/blog/<slug>/<slug>.md with isDraft: true.
// Publish it later with `pnpm post src/content/blog/<slug>/<slug>.md`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BLOG_DIR, fail, parseArgs, slugify, todayISO } from "./lib/post.mjs";

const args = parseArgs(process.argv.slice(2));
const title = args._.join(" ").trim();
if (!title) fail('Usage: pnpm post:new "Title" [--category issue|essay] [--slug slug]');

const slug = args.slug ?? slugify(title);
const category = args.category ?? "issue";
const dir = new URL(`${slug}/`, BLOG_DIR);
const file = new URL(`${slug}.md`, dir);
if (existsSync(file)) fail(`A post already exists at ${fileURLToPath(file)}`);

const template = readFileSync(
  new URL("./templates/issue.md", import.meta.url),
  "utf8",
);
const content = template
  .replaceAll("{{title}}", title.replaceAll('"', '\\"'))
  .replaceAll("{{slug}}", slug)
  .replaceAll("{{category}}", category)
  .replaceAll("{{date}}", todayISO());

mkdirSync(dir, { recursive: true });
writeFileSync(file, content);
console.log(`Draft created: src/content/blog/${slug}/${slug}.md`);
console.log(`Publish with:  pnpm post src/content/blog/${slug}/${slug}.md`);
console.log("Preview:       restart `pnpm dev` once so it sees the new folder, then open /writing");
