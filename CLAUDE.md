# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MapleStory character progress tracker ("Maple Hub") — a Next.js 15 full-stack app deployed on Vercel Hobby tier. Players search characters, view stats/equipment, track progress over time, and compare combat power on leaderboards. Data persists via Google Sheets (no traditional database).

## Commands

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm run start        # Start production server
npm run test         # Jest tests
npm run test:watch   # Jest watch mode
npm test -- --testPathPattern="__tests__/api/character" # Run specific test file/pattern
npm run lint         # ESLint (next/core-web-vitals + Prettier)
npm run format       # Prettier auto-format
npm run format:check # Prettier check (CI)
```

## Architecture

**Next.js App Router** with API routes as the backend. No separate backend server.

### Data Flow
- Frontend components (`'use client'`) call internal API routes (`app/api/`)
- API routes proxy to Nexon OpenAPI (character data) and Google Sheets API (persistence)
- Middleware (`middleware.js`) captures OCIDs from API requests for logging
- Client-side caching via localStorage (5-min expiry); server-side caching in Google Sheets module (5-min expiry, 10-min full refresh)
- Cron jobs are API routes (`app/api/cron/`) called by external cron services, authenticated via `CRON_SECRET` Bearer token

### Key Modules (lib/)
- `nexonApi.js` — Nexon OpenAPI client (character, equipment, union, hexa data)
- `googleSheets.js` — Google Sheets read/write with caching and deduplication
- `ocidLogger.js` — In-memory OCID buffer, synced to Google Sheets periodically
- `apiInterceptor.js` — Axios interceptor with throttling (0.2s delay in dev, none in prod)
- `cache.js` — Client-side localStorage cache utility
- `combatPowerService.js` / `characterInfoService.js` — Google Sheets-backed data services

### Pages
- `/` — Character search + stats/equipment/hexa visualization
- `/dashboard` — Character detail view
- `/dashboard-progress` — Historical progress charts (Recharts)
- `/leaderboard` — Combat power rankings

## Conventions

### Code Style
- Prettier: 80-char width, single quotes, trailing commas (es5), semicolons, 2-space indent
- ESLint: `next/core-web-vitals` + Prettier integration
- ES modules (`"type": "module"` in package.json)

### Naming
- `camelCase` — variables, functions, API methods
- `PascalCase` — React components (filenames match: `CharacterCard.js`)
- `kebab-case` — directories and non-component files
- `UPPER_SNAKE_CASE` — constants and environment variables

### React Patterns
- Functional components with hooks only
- `React.memo()` for expensive renders
- `'use client'` directive on all interactive components
- MUI 7 as primary component library; prefer MUI over custom components
- Tailwind CSS 4 for utility styling (secondary to MUI)
- Theme: orange primary (`#f7931e`), cream background (`#fff7ec`), Nunito + Comic Neue fonts

### API Routes
- Export named `GET`/`POST` functions
- Return `NextResponse.json()` with appropriate status codes
- Cron routes validate `Authorization: Bearer <CRON_SECRET>`
- Must complete within 10-second Vercel timeout

### Testing
- Jest 30 + React Testing Library in jsdom environment
- Tests in `__tests__/` mirroring source structure
- Mock external APIs (axios, fetch) — never call real APIs in tests
- `jest.setup.js` provides global mocks for fetch, Response, ResizeObserver

## Platform Constraints (Vercel Hobby)

- **10-second serverless function timeout** — all API routes must complete within this
- **No persistent disk storage** — use Google Sheets as database
- **No native cron** — cron jobs are API routes triggered by external services
- **Cold starts expected** — in-memory state (like OCID buffer) is ephemeral
- **Zero-cost services only** — Google Sheets API, external cron free tiers

## Feature Specifications

Feature specs live in `specs/` (001 through 015), each with `SPEC.md`, `plan.md`, `tasks.md`, and supporting docs. Project constitution and templates are in `.specify/memory/constitution.md` and `.specify/templates/`.
