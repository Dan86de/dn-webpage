import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";

export async function GET(context: APIContext) {
  // Query published posts (filter drafts)
  const allPosts = await getCollection("blog");
  const posts = allPosts
    .filter((post) => !post.data.isDraft)
    .sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());

  return rss({
    title: "Daniel Noworyta's Blog",
    description: "Articles about web development, TypeScript, React, and software engineering.",
    site: context.site || "http://localhost:4321",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      link: `/blog/${post.data.slug}`,
      pubDate: post.data.publishDate,
      author: post.data.authorContact,
      categories: post.data.tags,
    })),
    customData: `<language>en-us</language>`,
  });
}
