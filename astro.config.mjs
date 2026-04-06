// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import remarkBreaks from "remark-breaks";
import { remarkBlogCard } from "./src/lib/remark-blog-card.mjs";

import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    remarkPlugins: [remarkBlogCard,remarkBreaks]
  },

  image: {
    domains: ["imag.samenoko.work"],
    remotePatterns: [{ protocol: "https" }]
  },

  site: "https://blog.samenoko.work",
  integrations: [expressiveCode()]
});