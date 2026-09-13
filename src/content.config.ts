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
    // The weekly letter is an "issue" (numbered in the UI), longer pieces are
    // "essays". Older posts predate the split and default to essay.
    category: z.enum(["issue", "essay"]).default("essay"),
    author: z.string().default("Anonymous"),
    tags: z.array(z.string()),
    publishDate: z.date(),
    authorContact: z.email(),
    // The site is the source. Omit to canonicalise to /writing/<slug>.
    canonicalURL: z.url().optional(),
    // Where else the piece was published, linked from the post footer.
    alsoPublishedOn: z
      .array(z.object({ name: z.string(), url: z.url() }))
      .default([]),
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
    // Sessions per week for habits that are not daily. Daily habits omit it
    // and get day streaks instead of weekly stats.
    weeklyTarget: z.number().int().positive().optional(),
    // Days the habit was done, as YYYY-MM-DD. Unquoted YAML dates parse as
    // Date objects, quoted ones as strings, so accept both and normalize.
    days: z
      .array(z.coerce.date())
      .transform((dates) => [...new Set(dates.map(isoDate))].sort()),
  }),
});

// One bet per week, in a file named after that week's Monday. See
// src/content/bets/README.md and src/lib/betting.ts.
const bets = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/bets" }),
  schema: z.object({
    // A habit file name, e.g. "crossfit".
    habit: z.string(),
    // Days logged from Monday to the due date that make it a "yes".
    target: z.number().int().positive(),
    question: z.string(),
    // Local Warsaw time, quoted: "YYYY-MM-DDTHH:MM". Betting closes then.
    due: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
    // First day that counts, e.g. the Saturday of a weekend bet. Defaults to
    // the Monday. Quoted or not, as the habit days are.
    from: z.coerce.date().transform(isoDate).optional(),
    // When betting closes, if that is earlier than the deadline: bets close
    // Wednesday, the sessions still count until `due`. Defaults to `due`.
    closes: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).optional(),
  }),
});

const burnAnchor = z.object({
  weight: z.number().positive(),
  kcal: z.number().positive(),
});

const weight = defineCollection({
  loader: glob({ pattern: "*.yaml", base: "./src/content/weight" }),
  schema: z.object({
    unit: z.enum(["kg", "lb"]).default("kg"),
    // Optional projection to a goal weight, drawn past the latest reading.
    projection: z
      .object({
        goal: z.number().positive(),
        intake: z.number().positive(),
        burn: z.tuple([burnAnchor, burnAnchor]),
        adherence: z.number().gt(0).max(1),
      })
      .optional(),
    entries: z
      .array(
        z.object({
          date: z.coerce.date().transform(isoDate),
          value: z.number().positive(),
        }),
      )
      // One reading per day, oldest first. A later duplicate wins.
      .transform((entries) =>
        [...new Map(entries.map((e) => [e.date, e])).values()].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      ),
  }),
});

export const collections = { blog, habits, weight, bets };
