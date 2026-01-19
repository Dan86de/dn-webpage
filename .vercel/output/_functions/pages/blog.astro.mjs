import { c as createAstro, a as createComponent, e as renderComponent, d as renderTemplate, m as maybeRenderHead, b as addAttribute } from '../chunks/astro/server_CWo-EdvC.mjs';
import 'piccolore';
import { g as getCollection } from '../chunks/_astro_content_U7RCT_Qd.mjs';
import { $ as $$Layout } from '../chunks/Layout_BtcI_T87.mjs';
import { $ as $$SEO, g as getReadingTime } from '../chunks/readingTime_FQFSkt_V.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro("https://danielnoworyta.com");
const prerender = false;
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const allPosts = await getCollection("blog");
  const publishedPosts = allPosts.filter((post) => !post.data.isDraft).sort((a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime());
  const selectedTag = Astro2.url.searchParams.get("tag");
  const posts = selectedTag ? publishedPosts.filter((post) => post.data.tags.includes(selectedTag)) : publishedPosts;
  const tagCounts = /* @__PURE__ */ new Map();
  publishedPosts.forEach((post) => {
    post.data.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });
  const allTags = Array.from(tagCounts.entries()).sort(
    (a, b) => a[0].localeCompare(b[0])
  );
  const siteUrl = "http://localhost:4321";
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<div class="px-(--inline-padding)"> <div class="max-w-7xl mx-auto py-12"> <header class="mb-12"> <h1 class="bg-brand-gradient bg-clip-text text-transparent font-medium pb-4">
Blog
</h1> <p class="text-gray-600 dark:text-gray-400 text-lg">
Articles about web development, TypeScript, React, and software
          engineering.
</p> </header> <!-- Tag filter --> <div class="mb-8"> <div class="flex flex-wrap gap-2"> <a href="/blog"${addAttribute([
    "px-3 py-1.5 text-sm rounded-md transition-colors",
    !selectedTag ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
  ], "class:list")}>
All posts (${publishedPosts.length})
</a> ${allTags.map(([tag, count]) => renderTemplate`<a${addAttribute(`/blog?tag=${encodeURIComponent(tag)}`, "href")}${addAttribute([
    "px-3 py-1.5 text-sm rounded-md transition-colors",
    selectedTag === tag ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
  ], "class:list")}> ${tag} (${count})
</a>`)} </div> </div> <!-- Blog post grid --> <div class="grid grid-cols-1 tablet:grid-cols-2 desktop:grid-cols-3 gap-6"> ${posts.map((post) => {
    const readingTime = getReadingTime(post.body || "");
    const formattedDate = post.data.publishDate.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric"
      }
    );
    return renderTemplate`<a${addAttribute(`/blog/${post.data.slug}`, "href")} class="group block p-6 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"> <article> <h2 class="text-xl font-medium mb-2 group-hover:text-orange-500 transition-colors"> ${post.data.title} </h2> <p class="text-gray-600 dark:text-gray-400 text-sm mb-4"> ${post.data.description} </p> <div class="text-xs text-gray-500 dark:text-gray-500 space-y-2"> <div> <span>${formattedDate}</span> <span class="mx-2">·</span> <span>${readingTime}</span> </div> ${post.data.tags.length > 0 && renderTemplate`<div class="flex flex-wrap gap-2"> ${post.data.tags.map((tag) => renderTemplate`<span class="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"> ${tag} </span>`)} </div>`} </div> </article> </a>`;
  })} </div> </div> </div> `, "head": async ($$result2) => renderTemplate`${renderComponent($$result2, "SEO", $$SEO, { "slot": "head", "title": "Blog - Daniel Noworyta", "description": "Articles about web development, TypeScript, React, and software engineering.", "canonicalURL": `${siteUrl}/blog`, "type": "website" })}` })}`;
}, "/Users/danielnoworyta/Desktop/code/dn-website/src/pages/blog/index.astro", void 0);

const $$file = "/Users/danielnoworyta/Desktop/code/dn-website/src/pages/blog/index.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
