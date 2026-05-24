# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

LingUBible (嶺南大學課程評價平台) — a course & lecturer review platform for Lingnan University students. React 18 + TypeScript SPA, Vite 7 build, Tailwind + shadcn/ui, Appwrite as the backend (BaaS), deployed to Appwrite Sites (lingubible.com).

## Commands

This project uses **Bun** (not npm). The CLI enforces this via `bun run ensure:bun-only`.

```bash
bun install               # install deps
bun run dev               # dev server on :8080 (--host already in the script)
bun run build             # production build (copies public/index.html → root, skips font processing)
bun run preview           # serve the built bundle
bun run lint              # eslint
bun run refactor:check    # = build + success echo; the de-facto "did I break it" check
```

There is **no automated test suite**. Verify changes by building (`bun run refactor:check`) and manually exercising critical flows (auth, review submission, localized views) in the dev server.

Build variants worth knowing: `build:fast` / `SKIP_FONT_PROCESSING=true` skip the LXGW WenKai font subsetting step. Font tooling lives behind `bun run fonts:*` (e.g. `fonts:rebuild`). Appwrite Sites runs `bun run build` (per the site config in `appwrite.json`).

### Deployment

The frontend is hosted on **Appwrite Sites** (configured under `sites` in `appwrite.json`); it builds via `bun run build` and is published either through the Appwrite git integration or the CLI.

```bash
bun run deploy:sites         # push the site to Appwrite Sites (appwrite push sites)
bun run deploy:functions     # Appwrite cloud functions (deploy-functions-simple.sh)
./deploy-functions-simple.sh # same, invoked directly
```

## Architecture

### Frontend shell (`src/App.tsx`)
Provider nesting (outer → inner): `QueryClientProvider` → `TooltipProvider` → `LanguageProvider` → `RecaptchaProvider` → `AuthProvider`. Routing is React Router with **two layout modes**: auth pages (`/login`, `/register`, `/oauth/*`, …) render standalone; everything else renders inside the main layout (sidebar + header + footer) via a nested `<Routes>`. Theme is applied imperatively to `documentElement` *before* React renders to avoid a flash (see `initializeTheme` in App.tsx and the `theme` object in `src/lib/utils.ts`). There is substantial custom mobile handling (swipe-to-open sidebar, overlay mode, `useEnhancedResponsive`).

### Data layer — `src/services/api/courseService.ts`
**This 7000-line static-method `CourseService` class is the heart of the app.** Nearly all domain data (courses, instructors, reviews, review votes, teaching records, terms) flows through it. Domain TypeScript interfaces (`Course`, `Instructor`, `Review`, `TeachingRecord`, `Term`, `InstructorDetail`, `*WithStats`, …) are defined at the top of this file. Custom hooks in `src/hooks/` wrap it for components (`useCoursesWithStats`, `useInstructorsWithStats`, `useCourseDetailOptimized`, etc.; "Optimized" / landing-page variants fetch lighter slices).

### Appwrite backend
Client setup in `src/lib/appwrite.ts` exports `account`, `databases`, and `tablesDB`. The codebase is **migrating from the legacy Databases API to the newer TablesDB API** (recent commits) — prefer `tablesDB` for new data access. Main database id is `lingubible` with collections `courses`, `reviews`, `review_votes`, `teaching_records`, `instructors`, `terms`. Separate databases (declared in `appwrite.json`): `user-stats-db`, `verification_system` (`verification_codes`, `password_resets`). `appwrite.json` is the source of truth for project/function/collection config.

### ⚠️ Caching is intentionally disabled
`src/utils/cache.ts` and `src/utils/persistentCache.ts` are **deliberate no-op stubs**. They were neutered because their background refreshes were exhausting the Appwrite free-plan request quota; the app now falls back to live queries every time. The key constants and method signatures are kept only for API compatibility. **Do not "re-enable" or reintroduce caching here without understanding the quota constraint.** React Query is mounted (`QueryClientProvider`) but most fetching goes through `CourseService` + hooks rather than query keys.

### Cloud functions (`functions/`)
Appwrite serverless functions, each a self-contained Bun project (`bun-1.1` runtime, own `package.json` / `bun.lock` / `node_modules`, entry `src/main.js`): `send-verification-email`, `cleanup-expired-codes` (cron `0 */6 * * *`), `get-user-stats`, `handle-review-vote`, `user-validation`. They deploy separately from the frontend.

### Auth & student verification
`AuthContext` (`src/contexts/AuthContext.tsx`) wraps `authService`. Registration is gated to Lingnan emails (`@ln.hk`) — see `src/config/devMode.ts`. **Dev mode** (`VITE_DEV_MODE=true`) allows any email and can bypass password strength (`VITE_DEV_BYPASS_PASSWORD=true`); never enable in production. Google OAuth is supported. A periodic timer in AuthContext calls the `cleanup-expired-codes` function to purge non-student sessions.

### Internationalization
Three languages: `en`, `zh-TW`, `zh-CN`. `LanguageContext` + `src/locales/index.ts` dynamically import and cache `src/locales/{lang}.ts` (lazy-loaded as a separate `locale` build chunk). Use `t('key', params)` from `useLanguage()`. Language is stored in a cookie; URL `?lang=` is handled by `useLanguageFromUrl`. Domain data carries multilingual fields via `_tc` (Traditional Chinese) and `_sc` (Simplified Chinese) suffixes (e.g. `course_title_tc`, `name_sc`). Keep translation keys in sync across all three locale files.

## Conventions

- **`@/` is the path alias for `src/`** (configured in `tsconfig.json` and `vite.config.ts`).
- TypeScript is intentionally loose: `strictNullChecks`, `noImplicitAny`, `noUnusedLocals` are **off**, and `any` is allowed. ESLint (`eslint.config.js`) has nearly every rule disabled. **Match the existing relaxed style; do not re-enable strict checks** as part of unrelated work.
- Functional components in `.tsx`, 2-space indentation, PascalCase components, camelCase variables/functions.
- Commit messages follow an emoji-prefix + Traditional Chinese summary style (e.g. `🚀 完成前 4 個檔案的 TablesDB API 遷移`, `⚡️ 重構資料載入以降低 Appwrite 請求`).

## Task Master (optional tooling)

This repo has Task Master AI configured (`.taskmaster/`, `.mcp.json`, and rules under `.cursor/rules/taskmaster/`). It's an optional agentic task-planning workflow, not required for normal development. If you need it, the full command / MCP reference lives in `.cursor/rules/taskmaster/dev_workflow.mdc` and `taskmaster.mdc`. Never hand-edit `.taskmaster/tasks/tasks.json` or `.taskmaster/config.json` — use the `task-master` CLI / MCP tools.
