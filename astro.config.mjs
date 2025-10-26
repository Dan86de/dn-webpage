// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
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
