// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://danielnoworyta.com",
  // Keep pre-v7 whitespace handling. The v7 default ("jsx") drops spaces
  // between newline-separated inline elements, e.g. the date · read time line.
  compressHTML: true,
  markdown: {
    shikiConfig: {
      theme: "github-dark",
      langs: [],
      wrap: true,
    },
  },
  // The writing section used to live at /blog. Keep old links alive.
  redirects: {
    "/blog": "/writing",
    "/blog/[slug]": "/writing/[slug]",
  },
  integrations: [react(), mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
    imagesConfig: {
      sizes: [344],
      minimumCacheTTL: 60,
      formats: ["image/webp"],
    },
    imageService: true,
    devImageService: "sharp",
    isr: true,
  }),
});
