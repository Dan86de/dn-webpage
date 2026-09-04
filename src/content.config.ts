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

export const collections = { blog };
