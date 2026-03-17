# Repository Guidelines

## Project Structure & Module Organization
This repository is an Astro site. Application routes live in `src/pages`, shared UI in `src/components`, page shells in `src/layouts`, and reusable utilities in `src/lib`. Blog content is stored as Markdown in `src/content/blog`, with the collection schema defined in `src/content.config.ts`. Static assets belong in `public/`; content-specific images are kept under `src/content/blog/images`.

## Build, Test, and Development Commands
Use Bun for local work because CI and deployment do the same.

- `bun install`: install dependencies.
- `bun dev`: start the Astro dev server on `localhost:4321`.
- `bun run build`: create the production build.
- `bun preview`: serve the built site locally.
- `bun astro check`: run Astro and TypeScript checks against the project.

## UI
Using daisyUI.
https://daisyui.com/llms.txt

## Coding Style & Naming Conventions
Prefer TypeScript and `.astro` components with double quotes and existing formatting. Newer files use 4-space indentation; keep surrounding style consistent when editing. Use `PascalCase` for components such as `Header.astro` and `Layout.astro`. Use lowercase, URL-friendly names for content files such as `src/content/blog/wordpress_cost_omoi.md`. Keep Tailwind and DaisyUI utility classes close to the markup they style, and avoid moving content schema rules out of `src/content.config.ts` unless the model changes materially.

## Testing Guidelines
There is no dedicated test suite yet. Treat `bun run build` and `bun astro check` as the minimum validation for every change. When editing blog content, verify frontmatter matches the schema: `title`, `description`, `pubDate`, optional `updatedDate`, `heroImage`, and tag objects shaped like `{ tag: "..." }`. Preview pages that change routing, tag pages, or blog rendering before opening a PR.

## Commit & Pull Request Guidelines
Recent history mixes short Japanese summaries (`細部の修正`) with direct English descriptions (`add ci`). Keep commit messages short, imperative, and specific to one change. In pull requests, include a brief summary, note any content or schema changes, link related issues, and attach screenshots for visible UI updates. Confirm local build output before requesting review.

## Deployment & Configuration
GitHub Actions builds on pushes to `main` and deploys with Wrangler to Cloudflare. Keep Node compatible with `>=22.12.0`, and avoid committing secrets; deployment credentials must stay in GitHub repository secrets.
