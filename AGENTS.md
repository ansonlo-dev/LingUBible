# Repository Guidelines

## Project Structure & Module Organization
The web client lives in `src/`, with domain-driven folders such as `components/`, `pages/`, `hooks/`, `utils/`, and `types/`. Cloud functions and Appwrite metadata are kept in `functions/` and `appwrite.json`, while static assets (icons, fonts, banner) sit under `public/`. Documentation is organized per language in `docs/`, and automation helpers are stored in `scripts/` and `tools/scripts/`. Use `bun run project:structure` for a quick tree when you need orientation.

## Build, Test, and Development Commands
Install dependencies with `bun install`. Run `bun run dev --host` for local development (the host flag is already part of the script). `bun run build` triggers the production Vite build with font preprocessing, and `bun run preview` serves the optimized bundle. Linting is available through `bun run lint`; fix any warnings before opening a pull request. The site auto-deploys to Appwrite Sites via the GitHub git integration (push to `main` triggers a build); deploy Appwrite functions with `bun run deploy:functions`.

## Coding Style & Naming Conventions
This codebase uses React + TypeScript with functional components in `.tsx`. Stick to two-space indentation, ES module imports, and Tailwind utility classes for styling. Shared hooks go in `src/hooks`, reusable UI in `src/components/ui`, and feature-specific pieces under `src/components/features`. Prefer descriptive camelCase for variables/functions, PascalCase for components, kebab-case file names, and keep translation keys synchronized across `docs/` and localization utilities. ESLint (`eslint.config.js`) runs with relaxed rules—match the existing style rather than re-enabling strict checks.

## Testing Guidelines
There is no dedicated automated test suite yet. Validate critical flows manually in the development server, especially authentication, review submission, and localized views. When touching build logic or scripts, run `bun run performance:test` to confirm assets compile. Document reproduction steps in your pull request if you discover regressions.

## Commit & Pull Request Guidelines
Recent history favors emoji-prefixed subject lines followed by a concise Traditional Chinese summary (e.g., `🚀 完成前 4 個檔案的 TablesDB API 遷移`). Keep each commit focused and reference issues where applicable. Pull requests should include: a clear summary, screenshots or recordings for UI changes, notes on i18n impact, and deployment considerations (Appwrite tables, Appwrite Sites, etc.). Link to any affected docs pages and request reviews from maintainers responsible for the touched areas.

## Environment & Deployment Tips
Copy `env.example` to `.env` when configuring local Appwrite endpoints. Ensure Appwrite collections and TablesDB migrations align with `appwrite-user-stats.json` before pushing data changes. Appwrite Sites/functions config lives in `appwrite.json`; never commit production secrets. For font updates, use `bun run fonts:rebuild` and verify optimized files under `public/fonts/` before deploying.
