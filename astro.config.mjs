// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import remarkBreaks from "remark-breaks";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    remarkPlugins: [remarkBreaks]
  },
  image: {
    domains: ["imag.samenoko.work"],
    remotePatterns: [{ protocol: "https" }]
  },
  site: "https://samenoko.work"
});
