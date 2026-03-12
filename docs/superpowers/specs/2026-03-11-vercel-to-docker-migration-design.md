# Maple Hub Migration: Vercel + Google Sheets → Docker + MySQL + Redis

## Overview

Migrate Maple Hub from Vercel Hobby tier (Google Sheets as database) to a self-hosted Docker environment with MySQL 9.6 and Redis 8.6. This removes the 10-second serverless timeout, eliminates Google Sheets dependency, and enables full relational data storage for all Nexon API responses.

## Architecture

```
Traefik (SSL/Routing)
    ↓
maple-hub container (Next.js App + API + node-cron)
    ├── mysql (via Docker infra network)
    └── redis (via Docker infra network)
```

All services connect through a shared Docker external network (`infra`). Traefik handles SSL termination and routing.

## Tech Stack Changes

| Component | Before | After |
|-----------|--------|-------|
| Hosting | Vercel Hobby (serverless) | Docker container (persistent) |
| Database | Google Sheets API | MySQL 9.6 (Community) |
| Cache | In-memory + localStorage | Redis 8.6 + localStorage |
| ORM | googleapis SDK | Drizzle ORM |
| Cron | Vercel Cron + external service | node-cron (in-process) |
| Timeout | 10 seconds | None |

### New Dependencies (to add)

- `drizzle-orm` — ORM for MySQL
- `drizzle-kit` — Drizzle migration/schema tooling (devDependency)
- `mysql2` — MySQL driver for Drizzle
- `ioredis` — Redis client
- `node-cron` — In-process cron scheduler

### Dependencies to Remove

- `googleapis` — Google Sheets API (replaced by MySQL)
- `better-sqlite3` — Unused

### Required Config Changes

- **`next.config.js`**: Add `output: 'standalone'` for Docker standalone build
- **`next.config.js`**: Add `serverExternalPackages: ['mysql2']` for Drizzle compatibility

## Database Schema (MySQL 9.6 + Drizzle ORM)

### Design Principles

- Frequently queried fields → dedicated columns with indexes
- Fixed-structure stat breakdowns (equipment options) → JSON columns
- Full Nexon API response coverage — nothing discarded
- Each Nexon endpoint maps to one or more tables
- All tables have `updated_at` for cache freshness checks

### 1. characters — Basic Info + Combat Power

```sql
CREATE TABLE characters (
  ocid VARCHAR(64) PRIMARY KEY,
  character_name VARCHAR(100),
  character_level INT,
  character_class VARCHAR(50),
  world_name VARCHAR(50),
  character_image TEXT,
  character_exp_rate DECIMAL(10,6) COMMENT 'Exp percentage from Nexon API, e.g. 45.123456',
  character_gender VARCHAR(10),
  character_guild_name VARCHAR(100),
  combat_power BIGINT,
  status ENUM('success','not_found','error') DEFAULT 'success',
  not_found_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_world_class (world_name, character_class),
  INDEX idx_combat_power (combat_power DESC),
  INDEX idx_name (character_name)
);
```

Source: `/character/basic` + `/character/stat` (combat_power from `final_stat`)

### 2. character_stats — Ability Values

```sql
CREATE TABLE character_stats (
  ocid VARCHAR(64) PRIMARY KEY,
  str INT,
  dex INT,
  int_stat INT,
  luk INT,
  attack_power INT,
  magic_power INT,
  boss_damage DECIMAL(6,2),
  critical_damage DECIMAL(6,2),
  ignore_defense DECIMAL(6,2),
  damage DECIMAL(6,2),
  final_damage DECIMAL(6,2),
  all_stats JSON COMMENT 'Complete final_stat array from Nexon API',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stats_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/character/stat`
- Key stats as columns for SQL queries (stat balance, ranking)
- `all_stats` JSON preserves full response including lesser-used stats

### 3. character_equipment — Equipment (3 Presets)

```sql
CREATE TABLE character_equipment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ocid VARCHAR(64) NOT NULL,
  preset_no TINYINT NOT NULL COMMENT '1, 2, or 3',
  item_equipment_slot VARCHAR(20) NOT NULL COMMENT 'e.g. 帽子, 武器, 上衣',
  item_equipment_part VARCHAR(50) COMMENT 'Weapon subtype, null for non-weapons',
  item_name VARCHAR(100),
  item_icon TEXT,
  item_level INT,
  starforce INT DEFAULT 0,
  scroll_upgrade INT DEFAULT 0,
  potential_option_grade VARCHAR(20) COMMENT '傳說/稀有/罕見/特殊',
  potential_option_1 VARCHAR(200),
  potential_option_2 VARCHAR(200),
  potential_option_3 VARCHAR(200),
  additional_potential_option_grade VARCHAR(20),
  additional_potential_option_1 VARCHAR(200),
  additional_potential_option_2 VARCHAR(200),
  additional_potential_option_3 VARCHAR(200),
  item_total_option JSON COMMENT '{str, dex, int, luk, attack_power, magic_power, ...}',
  item_base_option JSON,
  item_starforce_option JSON,
  item_add_option JSON,
  item_etc_option JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ocid_preset_slot (ocid, preset_no, item_equipment_slot),
  INDEX idx_ocid (ocid),
  INDEX idx_potential_grade (potential_option_grade),
  CONSTRAINT fk_equip_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/character/item-equipment`
- Potential grades/lines as columns (queryable: "how many legendary weapons")
- Stat breakdowns as JSON (display/calculation only)

### 4. character_hyper_stats — HyperStat (3 Presets)

```sql
CREATE TABLE character_hyper_stats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ocid VARCHAR(64) NOT NULL,
  preset_no TINYINT NOT NULL,
  stat_type VARCHAR(20) NOT NULL COMMENT 'e.g. 力量, Boss傷害, 爆擊傷害',
  stat_level INT DEFAULT 0,
  stat_increase VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ocid_preset_type (ocid, preset_no, stat_type),
  INDEX idx_ocid (ocid),
  CONSTRAINT fk_hyper_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);

CREATE TABLE character_hyper_stat_presets (
  ocid VARCHAR(64) PRIMARY KEY,
  use_preset_no TINYINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_hyper_preset_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/character/hyper-stat`

### 5. character_link_skills — Link Skills (3 Presets)

```sql
CREATE TABLE character_link_skills (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ocid VARCHAR(64) NOT NULL,
  preset_no TINYINT NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  skill_description TEXT,
  skill_effect TEXT,
  skill_level INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ocid_preset_skill (ocid, preset_no, skill_name),
  INDEX idx_ocid (ocid),
  CONSTRAINT fk_link_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);

CREATE TABLE character_link_skill_presets (
  ocid VARCHAR(64) PRIMARY KEY,
  use_preset_no TINYINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_link_preset_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/character/link-skill`

### 6. character_hexa_cores — Hexa Matrix Cores

```sql
CREATE TABLE character_hexa_cores (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ocid VARCHAR(64) NOT NULL,
  hexa_core_name VARCHAR(100) NOT NULL,
  hexa_core_level INT DEFAULT 0,
  hexa_core_type VARCHAR(20) COMMENT '技能/強化/精通/共用',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ocid_core (ocid, hexa_core_name),
  INDEX idx_ocid (ocid),
  CONSTRAINT fk_hexa_core_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/character/hexamatrix`

### 7. character_hexa_stats — Hexa Stat Cores

```sql
CREATE TABLE character_hexa_stats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ocid VARCHAR(64) NOT NULL,
  slot_id VARCHAR(10) NOT NULL,
  main_stat_name VARCHAR(50),
  sub_stat_name_1 VARCHAR(50),
  sub_stat_name_2 VARCHAR(50),
  main_stat_level INT DEFAULT 0,
  sub_stat_level_1 INT DEFAULT 0,
  sub_stat_level_2 INT DEFAULT 0,
  stat_grade INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ocid_slot (ocid, slot_id),
  INDEX idx_ocid (ocid),
  CONSTRAINT fk_hexa_stat_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/character/hexamatrix-stat`

### 8. character_symbols — Runes/Symbols

```sql
CREATE TABLE character_symbols (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ocid VARCHAR(64) NOT NULL,
  symbol_name VARCHAR(100) NOT NULL,
  symbol_icon TEXT,
  symbol_level INT DEFAULT 0,
  symbol_force INT DEFAULT 0,
  symbol_growth_count INT DEFAULT 0,
  symbol_require_growth_count INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ocid_symbol (ocid, symbol_name),
  INDEX idx_ocid (ocid),
  CONSTRAINT fk_symbol_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/character/symbol-equipment`

### 9. character_set_effects — Set Effects

```sql
CREATE TABLE character_set_effects (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ocid VARCHAR(64) NOT NULL,
  set_name VARCHAR(100) NOT NULL,
  set_level INT DEFAULT 0,
  set_effect_level INT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_ocid_set (ocid, set_name),
  INDEX idx_ocid (ocid),
  CONSTRAINT fk_set_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/character/set-effect`

### 10. character_union — Union Overview

```sql
CREATE TABLE character_union (
  ocid VARCHAR(64) PRIMARY KEY,
  union_level INT,
  union_grade VARCHAR(50),
  union_artifact_level INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_union_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/user/union-raider`

### 11. character_union_artifacts — Union Artifact Crystals

```sql
CREATE TABLE character_union_artifacts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ocid VARCHAR(64) NOT NULL,
  crystal_name VARCHAR(100),
  crystal_level INT,
  crystal_type VARCHAR(50),
  is_primary BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ocid (ocid),
  CONSTRAINT fk_artifact_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/user/union-artifact`

### 12. character_cash_equipment — Cash Shop Equipment

```sql
CREATE TABLE character_cash_equipment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ocid VARCHAR(64) NOT NULL,
  cash_item_name VARCHAR(200),
  cash_item_icon TEXT,
  cash_item_equipment_slot VARCHAR(20),
  cash_item_option JSON COMMENT '[{option_name, option_value}]',
  date_expire TIMESTAMP NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ocid (ocid),
  CONSTRAINT fk_cash_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/character/cashitem-equipment`

### 13. character_pet_equipment — Pet Equipment

```sql
CREATE TABLE character_pet_equipment (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  ocid VARCHAR(64) NOT NULL,
  pet_name VARCHAR(100),
  pet_icon TEXT,
  pet_equipment_slot VARCHAR(20),
  pet_total_option JSON,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ocid (ocid),
  CONSTRAINT fk_pet_character FOREIGN KEY (ocid) REFERENCES characters(ocid) ON DELETE CASCADE
);
```

Source: `/character/pet-equipment`

## Redis Design

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `ocid:exists:{ocid}` | OCID existence check (Redis String, value "1") | 1 hour |
| `ocid:buffer` | New OCID buffer (Redis Set data structure, SADD/SMEMBERS) | None (cleared after processing) |
| `cache:api:{endpoint}:{ocid}` | API response cache | 5 min |
| `leaderboard:latest` | Leaderboard cache | 10 min |
| `leaderboard:filters` | Filter options cache | 30 min |

### Benefits over current in-memory cache
- Survives container restarts (no cold start data loss)
- Shared across potential future horizontal scaling
- Built-in TTL management (no manual expiry logic)

## Module Replacement Map

Note: All new files use `.js` extension (project does not use TypeScript).

### Core Library Replacements

| Current Module | Replacement | Notes |
|----------------|-------------|-------|
| `lib/googleSheets.js` (1,305 lines) | `lib/db/schema.js` + `lib/db/queries.js` (Drizzle) | Complete removal |
| `lib/ocidLogger.js` | `lib/redis.js` (Redis SET for buffer) | No cold start loss |
| `lib/sharedLogger.js` | `lib/redis.js` (re-export OCID buffer functions) | Currently wraps ocidLogger |
| `lib/cache.js` (localStorage) | Keep as-is | Frontend cache unchanged |
| `lib/combatPowerService.js` | Refactor: remove batch size limits, timeout budget | Direct DB writes |
| `lib/characterInfoService.js` | Refactor into `lib/characterSyncService.js`: fetch all endpoints, write to all tables | Full data capture |
| `lib/envValidation.js` | Update: validate DB/Redis env vars instead of Google Sheets | |
| `lib/apiInterceptor.js` | Review: remove Vercel-specific 200ms throttle if unnecessary | |

### API Route Replacements

| Current Route | Change | Notes |
|---------------|--------|-------|
| `app/api/character/stats/route.js` | Refactor: replace GoogleSheetsClient + ocidLogger with Redis OCID buffer | Currently imports both |
| `app/api/leaderboard/route.js` | Refactor: SQL query with Redis cache | |
| `app/api/leaderboard/filters/route.js` | Refactor: `SELECT DISTINCT world_name, character_class FROM characters` | Currently imports GoogleSheetsClient |
| `app/api/sync-ocids/route.js` | Simplified: Redis buffer → DB insert | |
| `app/api/character/[ocid]/runes/route.js` | Refactor into `nexonApi.js` | Uses hardcoded TWMS API URL (see Nexon API note below) |
| `app/api/hexa-matrix/route.js` | Refactor: use `nexonApi.js` instead of direct axios | Currently creates own axios client |
| `app/api/hexa-matrix-stat/route.js` | Refactor: use `nexonApi.js` instead of direct axios | Same; has response transformation logic to preserve |
| All `app/api/cron/*` routes | Keep as HTTP endpoints for manual trigger; also register in `lib/cron.js` (node-cron) | Dual access: cron + manual |
| `app/api/debug-ocids/route.js` | Remove | Replaced by direct DB queries |

### Unchanged Routes (no modification needed)

These routes proxy Nexon API via `nexonApi.js` and do not use Google Sheets:

- `app/api/character/search/route.js`
- `app/api/character/equipment/route.js`
- `app/api/character/hyper-stat/route.js`
- `app/api/character/link-skill/route.js`
- `app/api/character/pet-equipment/route.js`
- `app/api/character/cashitem-equipment/route.js`
- `app/api/character/set-effect/route.js`
- `app/api/character/union-raider/route.js`
- `app/api/character/union-artifact/route.js`
- `app/api/union/[ocid]/route.js`
- `app/api/characters/route.js`
- `app/api/characters/[id]/route.js`

### Config File Changes

| File | Change |
|------|--------|
| `next.config.js` | Add `output: 'standalone'`, add `serverExternalPackages: ['mysql2']` |
| `vercel.json` | Remove |
| `package.json` | Add new deps, remove googleapis + better-sqlite3 |

### Test Files to Update

All test files that mock GoogleSheetsClient need rewriting to mock Drizzle DB:
- `__tests__/lib/googleSheets.test.js` — Remove
- `__tests__/lib/googleSheets.combatPower.test.js` — Remove
- `__tests__/lib/ocidLogger.test.js` — Rewrite for Redis
- `__tests__/api/cron/refreshAll.test.js` — Rewrite
- `__tests__/api/leaderboard.test.js` — Rewrite
- `__tests__/api/leaderboard-filters.test.js` — Rewrite
- `__tests__/api/syncOcids.test.js` — Rewrite

## Nexon API Endpoints (Complete List)

All endpoints that the cron job will fetch per character. 13 endpoints total:

| # | Endpoint | API Base | Table(s) |
|---|----------|----------|----------|
| 1 | `/character/basic` | `maplestory/v1` | characters |
| 2 | `/character/stat` | `maplestory/v1` | characters (combat_power), character_stats |
| 3 | `/character/item-equipment` | `maplestory/v1` | character_equipment |
| 4 | `/character/cashitem-equipment` | `maplestory/v1` | character_cash_equipment |
| 5 | `/character/pet-equipment` | `maplestory/v1` | character_pet_equipment |
| 6 | `/character/hyper-stat` | `maplestory/v1` | character_hyper_stats, character_hyper_stat_presets |
| 7 | `/character/link-skill` | `maplestory/v1` | character_link_skills, character_link_skill_presets |
| 8 | `/character/hexamatrix` | `maplestory/v1` | character_hexa_cores |
| 9 | `/character/hexamatrix-stat` | `maplestory/v1` | character_hexa_stats |
| 10 | `/character/set-effect` | `maplestory/v1` | character_set_effects |
| 11 | `/character/symbol-equipment` | **`maplestorytw/v1`** | character_symbols |
| 12 | `/user/union-raider` | `maplestory/v1` | character_union |
| 13 | `/user/union-artifact` | `maplestory/v1` | character_union_artifacts |

**Note:** Endpoint #11 (symbol-equipment) uses the Taiwan-specific API path (`maplestorytw/v1`), not the standard `maplestory/v1`. Currently hardcoded in `app/api/character/[ocid]/runes/route.js`. Will be moved into `nexonApi.js` with a separate base URL constant.

All 13 endpoints need to be consolidated into `lib/nexonApi.js` (currently only 10 are there; #8, #9, #11 are called directly in route handlers).

## Cron Job Redesign

Without the 10-second timeout:

| Job | Schedule | Behavior |
|-----|----------|----------|
| **refresh-all** | Every 6 hours | Process ALL characters in one run. Fetch all 13 endpoints per character. Upsert to all tables. No offset/chain needed. |
| **sync-ocids** | Every 5 min | Flush Redis OCID buffer → INSERT into characters table |
| **cleanup** | Daily | Remove characters with `not_found_count >= 3` |

Concurrency control: 10 parallel Nexon API requests (existing pattern), with configurable rate limiting.

### Cron Initialization

node-cron runs in-process, initialized via Next.js [instrumentation hook](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation) (`instrumentation.js`):

```js
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initCronJobs } = await import('./lib/cron.js');
    initCronJobs();
  }
}
```

Cron API routes are **kept as HTTP endpoints** for manual triggering (e.g., force refresh via curl), but scheduled execution is handled by node-cron.

### Rate Limit Consideration

100K characters x 13 endpoints = 1.3M API calls per refresh cycle. At 10 concurrent requests, this will take several hours. This is acceptable since the refresh runs every 6 hours and is non-blocking. Nexon API rate limits should be monitored; the concurrency level is configurable.

## Docker Deployment

### docker-compose.yml

```yaml
services:
  maple-hub:
    build: .
    restart: unless-stopped
    env_file:
      - .env
    networks:
      - infra
    labels:
      # Traefik routing labels (configured per deployment)

networks:
  infra:
    external: true
    name: infra
```

### Dockerfile

```dockerfile
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Multi-stage build for minimal image size. Next.js standalone output mode.

### .dockerignore

```
node_modules
.next
.git
__tests__
docs
*.md
.env*
```

### Health Check

Add a lightweight health endpoint at `/api/health` for Traefik:

```js
// app/api/health/route.js
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

Traefik label: `traefik.http.services.maple-hub.loadbalancer.healthcheck.path=/api/health`

### Environment Variables (.env)

```env
# Nexon API
NEXT_PUBLIC_API_BASE_URL=https://open.api.nexon.com/maplestory/v1
API_KEY=your_nexon_api_key

# MySQL
DB_HOST=mysql
DB_PORT=3306
DB_USER=maple_hub
DB_PASSWORD=your_password
DB_NAME=maple_hub

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Cron auth (kept for backward compatibility if needed)
CRON_SECRET=your_cron_secret
```

## Data Migration

Migration script runs locally, generates SQL file for server import:

1. Script reads all 3 Google Sheets (OCID registry, CombatPower, CharacterInfo)
2. Generates `migration.sql` with:
   - `CREATE TABLE IF NOT EXISTS` statements for `characters` and `character_stats`
   - `INSERT INTO characters` for all existing records (mapped from CharacterInfo + CombatPower sheets)
   - Only migrates data that exists in Google Sheets (basic info + combat power)
   - Other tables start empty and populate on first cron run
3. Copy `.sql` to server, import with `mysql -u root -p maple_hub < migration.sql`

Note: Google Sheets only has basic info and combat power. Full data (equipment, hyper stats, etc.) will be populated by the first cron refresh cycle after deployment.

## Data Volume Estimate (100K Characters)

| Table | Estimated Rows | Estimated Size |
|-------|---------------|----------------|
| characters | 100K | ~50 MB |
| character_stats | 100K | ~30 MB |
| character_equipment | 7.5M (100K x 25 x 3) | ~3 GB |
| character_hyper_stats | 3M (100K x 10 x 3) | ~300 MB |
| character_link_skills | 3.6M (100K x 12 x 3) | ~400 MB |
| character_hexa_cores | 1M | ~100 MB |
| character_hexa_stats | 600K | ~50 MB |
| character_symbols | 1M | ~80 MB |
| Others (union, set, cash, pet) | ~2M | ~200 MB |
| **Total** | **~17M** | **~4.2 GB** |

Well within MySQL capabilities. Proper indexes ensure query performance.

## Dashboard Progress Feature

The `/dashboard-progress` page displays historical progress charts. This feature currently works with client-side data only (no server-side history storage in Google Sheets). Since the user decided not to store historical snapshots, this feature continues to work as-is — it fetches data from Nexon API with date parameters for historical queries. No schema changes needed for this feature.

## Removed Components

### Files Deleted
- `lib/googleSheets.js` — entire file deleted (replaced by Drizzle DB layer)
- `lib/ocidLogger.js` — replaced by Redis-based implementation in `lib/redis.js`
- `lib/sharedLogger.js` — replaced by re-exports from `lib/redis.js`
- `vercel.json` — no longer needed
- `app/api/cron/combat-power-refresh/` — already deprecated, removed
- `app/api/cron/update-character-info/` — already deprecated, removed
- `app/api/cron/deduplicate-ocid/` — no longer needed (DB has unique constraints)
- `app/api/debug-ocids/` — replaced by direct DB queries
- `__tests__/lib/googleSheets.test.js` — removed with source
- `__tests__/lib/googleSheets.combatPower.test.js` — removed with source

### Dependencies Removed
- `googleapis` — replaced by MySQL via Drizzle
- `better-sqlite3` — was unused

### Environment Variables Removed
- `GOOGLE_SHEETS_PROJECT_ID`
- `GOOGLE_SHEETS_PRIVATE_KEY_ID`
- `GOOGLE_SHEETS_PRIVATE_KEY`
- `GOOGLE_SHEETS_CLIENT_EMAIL`
- `GOOGLE_SHEETS_CLIENT_ID`
- `GOOGLE_SHEETS_CLIENT_X509_CERT_URL`
- `SPREADSHEET_ID`
