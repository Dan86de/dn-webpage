import { defineCollection, z } from "astro:content";

import { glob, file } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    isDraft: z.boolean(),
    title: z.string(),
    // image: z.object({
    //   src: z.string(),
    //   alt: z.string(),
    // }),
    author: z.string().default("Anonymous"),
    tags: z.array(z.string()),

    // In YAML, dates written without quotes around them are interpreted as Date objects
    publishDate: z.date(), // e.g. 2024-09-17

    authorContact: z.string().email(),
    canonicalURL: z.string().url(),
    slug: z.string().default(""),
  }),
});

export const collections = { blog };
