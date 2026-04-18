# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A local X (Twitter) growth assistant that uses **Playwright browser automation** (no X API) to collect tweets, analyze topics, generate draft posts with AI personas, schedule/publish them, and track performance metrics. Written in Portuguese (UI, prompts, comments).

## First-time setup

```bash
npm install
npx playwright install chromium
cp .env.example .env          # edit: set X_USER_HANDLE and PLAYWRIGHT_CHANNEL=chrome
npm run health                # opens browser — log into X manually, then ctrl+c
```

After login, the persistent browser profile in `data/browser-profile/` preserves the session. Use `PLAYWRIGHT_CHANNEL=chrome` on macOS to avoid Crashpad issues with Playwright's Chromium.

## Commands

```bash
npm run dev          # Starts both API (tsx watch) and web (Vite) concurrently
npm run dev:api      # API only — tsx watch src/server.ts
npm run dev:web      # Frontend only — vite (web/vite.config.ts)
npm run build        # tsc + vite build
npm run start        # node dist/server.js (production)
npm run health       # CLI healthcheck — opens browser, checks X login status
npm run typecheck    # tsc --noEmit
npm run test         # vitest run (unit tests, no browser)
npm run test:watch   # vitest in watch mode
npm run test:browser # vitest integration tests (opens real Chrome, needs X session)
```

## Architecture

### Backend — Express 5 (`src/server.ts`)

Server setup, middleware mount, route mount, graceful shutdown. Port 3847 (configurable via `PORT`).

- `src/routes/` — One router per domain: `health`, `session`, `sync`, `events`, `topics`, `drafts`, `schedule`, `authors`, `personas`, `metrics`.
- `src/middleware/` — `auth.ts` (Bearer token), `errorHandler.ts` (centralized error handler + `asyncHandler` + `httpError`).
- `src/db/` — better-sqlite3 with WAL mode + versioned migration system.
  - `schema.ts` — Base schema (`CREATE TABLE IF NOT EXISTS`), runs on every startup.
  - `migrate.ts` — Reads `migrations/*.sql`, tracks versions in `schema_version` table. Runs after base schema.
  - `migrations/` — Pure SQL migration files (001_personas.sql, 002_post_metrics.sql). Portable for future Supabase migration.
  - `repositories/` — Typed query functions: `events`, `drafts`, `scheduled`, `authors`, `topics`, `personas`, `metrics`.
- `src/browser/` — Playwright persistent browser context with anti-detection patches.
  - `queue.ts` — Serial mutex queue (one browser operation at a time).
  - `session.ts` — Singleton context with stealth patches (webdriver, chrome object, permissions). Auto-detects system Chrome.
  - `selectors.ts` — Centralized CSS selectors for X's web UI (tweets, composer, metrics).
  - `collect.ts` — Scrapes tweets + media URLs from likes/profiles.
  - `post.ts` — Posts via web composer, captures tweet URL after publishing.
  - `healthcheck.ts` — Verifies login with `evaluateLogin()` (pure logic, testable without browser).
- `src/ai/` — OpenAI integration (optional). Falls back to `heuristicTopics.ts`.
  - `llm.ts` — Topic analysis, batch draft generation (N variations), embedding similarity check. Supports persona system prompts.
- `src/jobs/` — Business logic: `analyze`, `draft` (with personas + mentors), `syncWatchlist`, `publishWorker`, `collectMetrics`.
- `src/shared/types.ts` — TypeScript interfaces shared between backend and frontend.
- `src/config.ts` — All env vars and operation constants centralized.

### Frontend — React SPA (`web/`)

Vite + React with step-based pipeline UI. Uses `@shared` alias for shared types.

- `web/src/api.ts` — Typed API client with Bearer token support.
- `web/src/components/` — Pipeline steps: `Step`, `SessionCard`, `CollectCard`, `TopicsSection`, `DraftsSection`, `PersonaSelector`, `ScheduleSection`, `MetricsDashboard`.
- `web/src/App.tsx` — 6-step pipeline orchestrator.

### Data directory

`./data/` holds `app.db` (SQLite), `browser-profile/` (Playwright persistent context), `crash-dumps/`.

## Key design decisions

- Browser uses system Chrome (`executablePath`) when available, with `ignoreDefaultArgs: ["--enable-automation"]` + `addInitScript` patches for stealth. No banners.
- All browser operations go through `src/browser/queue.ts` — serial mutex prevents concurrent navigation.
- All OpenAI features are optional; without `OPENAI_API_KEY`, topic analysis uses local term frequency.
- **Personas** are prompt presets (Estrategista, Provocador, Educador, Storyteller) stored in DB. User selects one to change the AI's voice.
- **Draft generation** produces N distinct variations in one LLM call, using mentor detection (top authors by engagement) and anti-repetition (excludes recent drafts).
- **Metrics collection** scrapes likes/retweets/views from published tweets, runs automatically every 6h.
- **Migration system** uses numbered SQL files (`src/db/migrations/`), tracked in `schema_version`. SQL is portable for PostgreSQL/Supabase.
- Publish worker + metrics worker run in-process via `setInterval`. App must stay running.

## Testing

Tests in `tests/` using Vitest:
- `npm test` — Unit tests (31): healthcheck logic, selectors, queue, validation, pagination, heuristics.
- `npm run test:browser` — Integration tests (4): opens Chrome, navigates X, validates selectors against real DOM.
