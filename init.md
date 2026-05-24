# LingUBible Project Notes

This repo is a Vite + React + TypeScript web client. The bulk of the app lives under `src/`, split into feature-driven folders (`components/`, `pages/`, `hooks/`, `services/`, `utils/`). Automation scripts sit in `scripts/` (Node) and `tools/scripts/` (Bun). Static assets are in `public/` and Appwrite configuration lives beside the root config files (e.g. `appwrite.json`).

## Data Fetching Architecture

### Appwrite client
- `src/lib/appwrite.ts` exports a shared Appwrite `Client`, `Account`, legacy `Databases`, and the new `TablesDB` helpers.
- All API services import from this module. Authentication state flows through `AuthContext` (see `src/contexts`).

### Service layer
- The biggest entry point is `src/services/api/courseService.ts`. It wraps all course, instructor, review, teaching-record, and stats queries against Appwrite Tables.
- Related service files (`avatar.ts`, `favoritesService.ts`, `registeredUsersService.ts`, `appwriteUserStats.ts`) follow the same pattern: strongly typed helpers around Appwrite endpoints.
- These files are what pages and hooks use. There is no shared caching layer any more: every call is live.

### Hooks and pages
- Hooks such as `src/hooks/useCoursesWithStats.ts` and `src/hooks/useInstructorDetailedStats.ts` call into `CourseService` to load data and expose state (`loading`, `error`, etc.).
- High-level pages (`src/pages/Index.tsx`, `src/pages/InstructorsList.tsx`, the course catalog, etc.) use those hooks or call the service methods directly to populate UI state.
- The mobile search modal (`src/components/common/MobileSearchModal.tsx`) batches a few of the service calls so typing suggestions can appear quickly.

## Removed/Disabled Caching

Recent changes removed the aggressive in-browser caching that was exhausting the Appwrite free tier:
- `src/utils/globalDataManager.ts` has been deleted. Pages now read directly from `CourseService` without going through a global singleton.
- `src/utils/cache.ts` and `src/utils/persistentCache.ts` still export the same APIs but they are no-ops. Any call to `set`/`get` returns nothing so downstream code falls back to direct queries.
- `src/utils/preloader.ts` remains wired in `main.tsx`, but `initializeDataPreloading()` now resolves immediately without warming caches or queueing network work.

With this setup the website issues Appwrite reads only when UI flows genuinely need data, keeping within the GitHub Student plan limits.

## Getting Oriented Quickly

- Run `bun run project:structure` for an abbreviated tree of the folders mentioned above.
- Use `rg` (ripgrep) for searching – it is already available in the workspace. Examples:
  - `rg "CourseService\.get" src/pages` shows which views call into the service layer.
  - `rg "useCoursesWithStats" -g"*.tsx" src` finds where hooks are mounted.
- For Appwrite schema tweaks, inspect `appwrite-user-stats.json` and the functions inside `functions/`.

## Common Tasks

- Install deps: `bun install`
- Development server: `bun run dev --host`
- Production build: `bun run build`
- Lint: `bun run lint` (note the current repo has missing shared ESLint rule packages, so warnings/errors under `.vite/deps` are expected until the rule presets are restored).

This document should give you enough context to navigate the codebase without having to retrace the long cache investigation that originally led to these changes.
