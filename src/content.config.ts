import { defineCollection } from "astro:content";
import { z } from "astro/zod";

import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    isDraft: z.boolean(),
    title: z.string(),
    description: z.string(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    category: z.string().optional(),
    author: z.string().default("Anonymous"),
    tags: z.array(z.string()),
    publishDate: z.date(),
    authorContact: z.email(),
    canonicalURL: z.url(),
    slug: z.string().default(""),
  }),
});

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const habits = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/habits" }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    order: z.number().default(0),
    // Days the habit was done, as YYYY-MM-DD. Unquoted YAML dates parse as
    // Date objects, quoted ones as strings, so accept both and normalize.
    days: z
      .array(z.coerce.date())
      .transform((dates) => [...new Set(dates.map(isoDate))].sort()),
  }),
});

export const collections = { blog, habits };
