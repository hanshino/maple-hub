# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MapleStory character progress tracker ("Maple Hub") — a Next.js 15 full-stack app self-hosted via Docker + Traefik on a VPS. Players search characters, view stats/equipment, track progress over time, and compare combat power on leaderboards. Data persists in MySQL (via Drizzle ORM) with Redis caching.

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
- API routes proxy to Nexon OpenAPI (character data) and persist to MySQL
- `/api/character/[ocid]` auto-syncs from Nexon API if data is missing or stale (>10 min)
- Client-side caching via localStorage (5-min expiry); server-side caching via Redis
- Cron jobs run via `node-cron` in the Node.js process (`lib/cron.js`): refresh stale characters every 6 hours, cleanup daily

### Key Modules (lib/)

- `nexonApi.js` — Nexon OpenAPI client (character, equipment, union, hexa data)
- `characterSyncService.js` — Syncs character data from Nexon API to MySQL (13 parallel API calls per OCID)
- `db/schema.js` — Drizzle ORM schema (characters, stats, equipment, hyper stats, link skills, hexa, symbols, set effects, union, cash/pet equipment)
- `db/queries.js` — All DB read/write operations (upsert, leaderboard, full character data)
- `db/index.js` — MySQL connection pool (mysql2 + Drizzle)
- `redis.js` — Redis client with key prefix and password auth
- `cron.js` — node-cron scheduled jobs (stale refresh, cleanup)

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

### Testing

- Jest 30 + React Testing Library in jsdom environment
- Tests in `__tests__/` mirroring source structure
- Mock external APIs (axios, fetch) — never call real APIs in tests
- `jest.setup.js` provides global mocks for fetch, Response, ResizeObserver

## Deployment

- **Self-hosted** on VPS via Docker + Traefik reverse proxy
- **Domain:** `maple-hub.hanshino.dev`
- **Docker images:** built as multi-stage (`deps` → `builder` → `migrator` / `runner`), published to `ghcr.io/hanshino/maple-hub`
- **Networks:** `traefik` (public-facing), `infra` (internal — MySQL, Redis)
- **MySQL and Redis** are shared infrastructure on the `infra` Docker network (hosts: `infra-mysql-1`, `infra-redis-1`)
- **Migrations** run as a separate `migrate` container before the app starts
- **No serverless timeout constraints** — long-running operations are possible

## Feature Specifications

Feature specs live in `specs/` (001 through 015), each with `SPEC.md`, `plan.md`, `tasks.md`, and supporting docs. Project constitution and templates are in `.specify/memory/constitution.md` and `.specify/templates/`.
