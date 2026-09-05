#!/usr/bin/env node
// Publish a post:
//   pnpm post <file> [--slug slug] [--date YYYY-MM-DD] [--category issue|essay] [--force]
//
// Two cases:
// 1. The file is a draft already inside src/content/blog: flip isDraft to
//    false and stamp the publish date. Nothing else is touched.
// 2. The file is anywhere else (an Obsidian note, a scratch file): copy it
//    into the collection with frontmatter filled in. Title comes from the
//    frontmatter or the first H1, description from the frontmatter or the
//    first paragraph, tags from the frontmatter or none.
// Either way the post is validated against what the site needs before it
// is written, and the file is never overwritten without --force.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  BLOG_DIR,
  fail,
  isISODate,
  joinFrontmatter,
  parseArgs,
  slugify,
  splitFrontmatter,
  todayISO,
} from "./lib/post.mjs";

const args = parseArgs(process.argv.slice(2));
const [input] = args._;
if (!input) {
  fail(
    "Usage: pnpm post <file> [--slug slug] [--date YYYY-MM-DD] [--category issue|essay] [--force]",
  );
}
const source = resolve(input);
if (!existsSync(source)) fail(`No file at ${source}`);

const date = args.date ?? todayISO();
if (!isISODate(date)) fail(`Invalid date "${date}", expected YYYY-MM-DD`);

const blogDir = fileURLToPath(BLOG_DIR);
const inCollection = !relative(blogDir, source).startsWith("..");

const { data, body: rawBody } = splitFrontmatter(readFileSync(source, "utf8"));
let body = rawBody;

// Title: frontmatter, else the first H1 (which is then removed from the body
// because the layout renders the title itself).
let title = data.title;
if (!title) {
  const h1 = body.match(/^#\s+(.+?)\s*$/m);
  if (h1) {
    title = h1[1].trim();
    body = body.replace(h1[0], "").replace(/^\s+/, "");
  }
}
if (!title) fail("No title: add `title:` to the frontmatter or start with a # heading");

// Description: frontmatter, else the first paragraph, trimmed.
let description = (data.description ?? "").toString().trim();
if (!description) {
  const paragraph = body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith("#") && !p.startsWith("<!--") && !p.startsWith("!["));
  if (paragraph) {
    description = paragraph.replace(/\s+/g, " ").slice(0, 200).trim();
    console.warn(`No description in frontmatter, using the first paragraph:\n  "${description}"`);
  }
}
if (!description) fail("No description: add `description:` to the frontmatter");

const slug = args.slug ?? data.slug ?? slugify(title);
if (!slug) fail("Could not derive a slug from the title, pass --slug");

// Images the site cannot serve: Obsidian-style relative links.
for (const match of body.matchAll(/!\[[^\]]*\]\(([^)]+)\)|!\[\[([^\]]+)\]\]/g)) {
  const target = match[1] ?? match[2];
  if (!/^https?:\/\//.test(target)) {
    console.warn(`Image "${target}" is a relative link; copy it into src/content/blog/${slug}/ and fix the path`);
  }
}

const tags = Array.isArray(data.tags)
  ? data.tags.map(String)
  : typeof data.tags === "string"
    ? data.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

// Strip the template's guidance comments so they never ship.
body = body.replace(/<!--[\s\S]*?-->\s*/g, "").replace(/^\s+/, "");
if (!body.trim()) fail("The post has no body");

const frontmatter = {
  isDraft: false,
  title,
  description,
  author: data.author ?? "Daniel Noworyta",
  authorContact: data.authorContact ?? "daniel.noworyta@gmail.com",
  category: args.category ?? data.category ?? "issue",
  tags,
  publishDate: args.date ?? (inCollection && data.isDraft === false && data.publishDate ? data.publishDate : date),
  slug,
};
if (data.image) frontmatter.image = data.image;
if (data.imageAlt) frontmatter.imageAlt = data.imageAlt;
if (data.canonicalURL) frontmatter.canonicalURL = data.canonicalURL;
if (data.alsoPublishedOn) frontmatter.alsoPublishedOn = data.alsoPublishedOn;
// YAML stringify would turn a Date back into a timestamp; keep plain dates.
if (frontmatter.publishDate instanceof Date) {
  frontmatter.publishDate = frontmatter.publishDate.toISOString().slice(0, 10);
}

const dir = new URL(`${slug}/`, BLOG_DIR);
const target = fileURLToPath(new URL(`${slug}.md`, dir));
if (existsSync(target) && target !== source && !args.force) {
  fail(`A post already exists at ${relative(process.cwd(), target)}; pass --force to overwrite`);
}

mkdirSync(dir, { recursive: true });
writeFileSync(target, joinFrontmatter(frontmatter, body));

const rel = relative(process.cwd(), target);
console.log(`Published: ${rel}`);
console.log(`URL:       https://danielnoworyta.com/writing/${slug}`);
if (!inCollection) console.log(`Next:      git add ${rel}`);
