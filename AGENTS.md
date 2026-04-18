# AGENTS.md

## Commands

```bash
npm run dev          # API (tsx watch) + web (Vite) concurrently
npm run dev:api      # API only
npm run dev:web      # Frontend only
npm run build        # tsc + vite build
npm run typecheck    # tsc --noEmit
npm run test         # vitest run (all tests)
npm run test:watch   # vitest watch
npm run health       # opens browser — checks X login status
```

Run `typecheck` after changes; there is no separate lint command.

## First-time setup

```bash
npm install
npx playwright install chromium
cp .env.example .env   # set X_USER_HANDLE at minimum
npm run health         # log into X manually, then ctrl+c
```

## Architecture

- **Backend**: Express 5, ESM (`"type": "module"`), port 3847. Entry: `src/server.ts`.
- **Frontend**: Vite + React SPA in `web/`. Proxies `/api` to backend in dev.
- **Shared types**: `src/shared/types.ts` — imported by frontend via `@shared` alias (configured in `web/vite.config.ts` and `web/tsconfig.json`).
- **Database**: better-sqlite3 with WAL, auto-created at `data/app.db`. Schema bootstrapped on first `getDb()` call.
- **All SQL lives in** `src/db/repositories/`, never in routes or jobs.
- **Browser automation**: Playwright persistent context at `data/browser-profile/`. Runs headless:false.
  - `src/browser/queue.ts` — serial mutex; **all browser ops must go through it**.
  - `src/browser/selectors.ts` — CSS selectors for X's DOM; fragile, may break on X UI changes.
- **AI**: OpenAI integration is optional. Without `OPENAI_API_KEY`, falls back to `src/ai/heuristicTopics.ts`.
- **Config**: All env vars and operation constants centralized in `src/config.ts`.
- **Middleware**: `src/middleware/auth.ts` (Bearer token, optional — skipped if `API_TOKEN` empty), `src/middleware/errorHandler.ts` (`asyncHandler` wrapper + `httpError` factory).
- **Publish worker**: In-process `setInterval` with retry. App must stay running for scheduled posts.

## Testing

- Tests in `tests/` using Vitest. No vitest.config file — uses defaults.
- Run a single test file: `npx vitest run tests/queue.test.ts`
- Coverage: heuristic topics, handle validation, browser queue, pagination.

## Key constraints

- UI, prompts, and comments are written in **Portuguese**.
- `data/` is gitignored (contains `app.db`, `browser-profile/`, `.playwright-home/`).
- Playwright subprocess uses sandboxed `HOME=data/.playwright-home/` to avoid writing to `~/Library`.
- Import style: ESM with `.js` extensions in imports (NodeNext moduleResolution).
- Frontend build output goes to `web/dist/`; backend build output to `dist/`.
