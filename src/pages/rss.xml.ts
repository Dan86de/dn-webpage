import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPublishedPosts } from "@/lib/posts";

export async function GET(context: APIContext) {
  const site = context.site ?? new URL("http://localhost:4321");
  const posts = await getPublishedPosts();

  return rss({
    title: "Daniel Noworyta",
    description:
      "What it is like to do this job while AI rewrites it. Written from inside the work, not from above it.",
    site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      // Full text, so the piece reads in the feed reader. Relative links in
      // the markdown are rewritten to absolute ones for readers that do not
      // resolve them against the item link.
      content: absolutise(post.rendered?.html ?? "", site),
      link: `/writing/${post.data.slug}`,
      pubDate: post.data.publishDate,
      author: post.data.authorContact,
      categories: [post.data.category, ...post.data.tags],
    })),
    customData: `<language>en-us</language>`,
  });
}

function absolutise(html: string, site: URL): string {
  return html.replace(
    /(href|src)="(\/[^"]*)"/g,
    (_, attr, path) => `${attr}="${new URL(path, site).href}"`,
  );
}
