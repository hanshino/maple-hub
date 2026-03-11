# Vercel → Docker + MySQL + Redis Migration Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Google Sheets with MySQL + Redis and deploy via Docker instead of Vercel.

**Architecture:** Drizzle ORM for MySQL, ioredis for Redis, node-cron for scheduled jobs. Next.js standalone output for Docker. All new files use `.js` (no TypeScript).

**Tech Stack:** Next.js 15, Drizzle ORM, MySQL 9.6, Redis 8.6 (ioredis), node-cron

**Spec:** `docs/superpowers/specs/2026-03-11-vercel-to-docker-migration-design.md`

**Local dev:** `docker-compose.dev.yml` provides MySQL (localhost:3306) and Redis (localhost:6380). Run `docker compose -f docker-compose.dev.yml up -d` before starting.

---

## File Structure

### New Files

```
lib/db/index.js          — Drizzle DB connection (mysql2 pool)
lib/db/schema.js         — Drizzle table definitions (13 tables)
lib/db/queries.js         — DB query functions (CRUD for all tables)
lib/redis.js             — ioredis client + OCID buffer functions
lib/cron.js              — node-cron job registration
lib/characterSyncService.js — Fetch all 13 endpoints, upsert to DB
instrumentation.js       — Next.js instrumentation hook (starts cron)
app/api/health/route.js  — Health check endpoint
Dockerfile               — Multi-stage production build
docker-compose.yml       — Production compose (infra network)
.dockerignore            — Exclude non-production files
scripts/migrate-from-sheets.js — Google Sheets → SQL migration script
drizzle.config.js        — Drizzle Kit config
```

### Modified Files

```
next.config.js           — Add output: 'standalone', serverExternalPackages
package.json             — Add/remove dependencies
lib/nexonApi.js          — Add 3 missing endpoints (#8, #9, #11)
lib/envValidation.js     — Replace Google Sheets vars with DB/Redis vars
app/api/character/stats/route.js — Replace GoogleSheets+ocidLogger with Redis
app/api/leaderboard/route.js — Replace GoogleSheets with SQL queries
app/api/leaderboard/filters/route.js — Replace GoogleSheets with SQL query
app/api/sync-ocids/route.js — Replace GoogleSheets with Redis→DB flow
app/api/cron/refresh-all/route.js — Remove timeout budget, use new sync service
app/api/hexa-matrix/route.js — Use nexonApi.js instead of direct axios
app/api/hexa-matrix-stat/route.js — Use nexonApi.js instead of direct axios
app/api/character/[ocid]/runes/route.js — Use nexonApi.js
```

### Deleted Files

```
lib/googleSheets.js
lib/ocidLogger.js
lib/sharedLogger.js
lib/characterInfoService.js          — Replaced by lib/characterSyncService.js
lib/combatPowerService.js            — Replaced by lib/characterSyncService.js
vercel.json
app/api/cron/combat-power-refresh/
app/api/cron/update-character-info/
app/api/cron/deduplicate-ocid/
app/api/debug-ocids/
__tests__/lib/googleSheets.test.js
__tests__/lib/googleSheets.combatPower.test.js
__tests__/lib/ocidLogger.test.js
__tests__/middleware.test.js
__tests__/api/cron/refreshAll.test.js
__tests__/api/cron/combatPowerRefresh.test.js
__tests__/api/syncOcids.test.js
__tests__/api/leaderboard.test.js
__tests__/api/leaderboard-filters.test.js
```

---

## Chunk 1: Foundation — Dependencies, Config, DB Schema, Redis Client

### Task 1: Install Dependencies and Update Config

**Files:**
- Modify: `package.json`
- Modify: `next.config.js`
- Create: `drizzle.config.js`
- Create: `.dockerignore`

- [ ] **Step 1: Install new dependencies**

```bash
npm install drizzle-orm mysql2 ioredis node-cron
npm install -D drizzle-kit
```

- [ ] **Step 2: Remove old dependencies**

```bash
npm uninstall googleapis better-sqlite3
```

- [ ] **Step 3: Update next.config.js**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['mysql2'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img-api.neople.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'open.api.nexon.com',
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create drizzle.config.js**

```js
import 'dotenv/config';

export default {
  schema: './lib/db/schema.js',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'maple_hub',
    password: process.env.DB_PASSWORD || 'maple_hub',
    database: process.env.DB_NAME || 'maple_hub',
  },
};
```

- [ ] **Step 5: Create .dockerignore**

```
node_modules
.next
.git
__tests__
docs
*.md
.env*
```

- [ ] **Step 6: Add dev DB/Redis env vars to .env.local**

Add these lines to `.env.local`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=maple_hub
DB_PASSWORD=maple_hub
DB_NAME=maple_hub
REDIS_HOST=localhost
REDIS_PORT=6380
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json next.config.js drizzle.config.js .dockerignore
git commit -m "chore: add Drizzle, ioredis, node-cron deps; update next.config for standalone"
```

---

### Task 2: Drizzle DB Schema

**Files:**
- Create: `lib/db/schema.js`

- [ ] **Step 1: Create lib/db/schema.js with all 13 tables**

```js
import {
  mysqlTable,
  varchar,
  int,
  bigint,
  tinyint,
  decimal,
  text,
  json,
  timestamp,
  boolean,
  mysqlEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';

// 1. characters
export const characters = mysqlTable(
  'characters',
  {
    ocid: varchar('ocid', { length: 64 }).primaryKey(),
    characterName: varchar('character_name', { length: 100 }),
    characterLevel: int('character_level'),
    characterClass: varchar('character_class', { length: 50 }),
    worldName: varchar('world_name', { length: 50 }),
    characterImage: text('character_image'),
    characterExpRate: decimal('character_exp_rate', {
      precision: 10,
      scale: 6,
    }),
    characterGender: varchar('character_gender', { length: 10 }),
    characterGuildName: varchar('character_guild_name', { length: 100 }),
    combatPower: bigint('combat_power', { mode: 'number' }),
    status: mysqlEnum('status', ['success', 'not_found', 'error']).default(
      'success'
    ),
    notFoundCount: int('not_found_count').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    index('idx_world_class').on(table.worldName, table.characterClass),
    index('idx_combat_power').on(table.combatPower),
    index('idx_name').on(table.characterName),
  ]
);

// 2. character_stats
export const characterStats = mysqlTable('character_stats', {
  ocid: varchar('ocid', { length: 64 })
    .primaryKey()
    .references(() => characters.ocid, { onDelete: 'cascade' }),
  str: int('str'),
  dex: int('dex'),
  intStat: int('int_stat'),
  luk: int('luk'),
  attackPower: int('attack_power'),
  magicPower: int('magic_power'),
  bossDamage: decimal('boss_damage', { precision: 6, scale: 2 }),
  criticalDamage: decimal('critical_damage', { precision: 6, scale: 2 }),
  ignoreDefense: decimal('ignore_defense', { precision: 6, scale: 2 }),
  damage: decimal('damage', { precision: 6, scale: 2 }),
  finalDamage: decimal('final_damage', { precision: 6, scale: 2 }),
  allStats: json('all_stats'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// 3. character_equipment
export const characterEquipment = mysqlTable(
  'character_equipment',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    presetNo: tinyint('preset_no').notNull(),
    itemEquipmentSlot: varchar('item_equipment_slot', { length: 20 }).notNull(),
    itemEquipmentPart: varchar('item_equipment_part', { length: 50 }),
    itemName: varchar('item_name', { length: 100 }),
    itemIcon: text('item_icon'),
    itemLevel: int('item_level'),
    starforce: int('starforce').default(0),
    scrollUpgrade: int('scroll_upgrade').default(0),
    potentialOptionGrade: varchar('potential_option_grade', { length: 20 }),
    potentialOption1: varchar('potential_option_1', { length: 200 }),
    potentialOption2: varchar('potential_option_2', { length: 200 }),
    potentialOption3: varchar('potential_option_3', { length: 200 }),
    additionalPotentialOptionGrade: varchar(
      'additional_potential_option_grade',
      { length: 20 }
    ),
    additionalPotentialOption1: varchar('additional_potential_option_1', {
      length: 200,
    }),
    additionalPotentialOption2: varchar('additional_potential_option_2', {
      length: 200,
    }),
    additionalPotentialOption3: varchar('additional_potential_option_3', {
      length: 200,
    }),
    itemTotalOption: json('item_total_option'),
    itemBaseOption: json('item_base_option'),
    itemStarforceOption: json('item_starforce_option'),
    itemAddOption: json('item_add_option'),
    itemEtcOption: json('item_etc_option'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_preset_slot').on(
      table.ocid,
      table.presetNo,
      table.itemEquipmentSlot
    ),
    index('idx_ocid').on(table.ocid),
    index('idx_potential_grade').on(table.potentialOptionGrade),
  ]
);

// 4. character_hyper_stats
export const characterHyperStats = mysqlTable(
  'character_hyper_stats',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    presetNo: tinyint('preset_no').notNull(),
    statType: varchar('stat_type', { length: 20 }).notNull(),
    statLevel: int('stat_level').default(0),
    statIncrease: varchar('stat_increase', { length: 100 }),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_preset_type').on(
      table.ocid,
      table.presetNo,
      table.statType
    ),
    index('idx_ocid').on(table.ocid),
  ]
);

// 4b. character_hyper_stat_presets
export const characterHyperStatPresets = mysqlTable(
  'character_hyper_stat_presets',
  {
    ocid: varchar('ocid', { length: 64 })
      .primaryKey()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    usePresetNo: tinyint('use_preset_no').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  }
);

// 5. character_link_skills
export const characterLinkSkills = mysqlTable(
  'character_link_skills',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    presetNo: tinyint('preset_no').notNull(),
    skillName: varchar('skill_name', { length: 100 }).notNull(),
    skillDescription: text('skill_description'),
    skillEffect: text('skill_effect'),
    skillLevel: int('skill_level'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_preset_skill').on(
      table.ocid,
      table.presetNo,
      table.skillName
    ),
    index('idx_ocid').on(table.ocid),
  ]
);

// 5b. character_link_skill_presets
export const characterLinkSkillPresets = mysqlTable(
  'character_link_skill_presets',
  {
    ocid: varchar('ocid', { length: 64 })
      .primaryKey()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    usePresetNo: tinyint('use_preset_no').notNull().default(1),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  }
);

// 6. character_hexa_cores
export const characterHexaCores = mysqlTable(
  'character_hexa_cores',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    hexaCoreName: varchar('hexa_core_name', { length: 100 }).notNull(),
    hexaCoreLevel: int('hexa_core_level').default(0),
    hexaCoreType: varchar('hexa_core_type', { length: 20 }),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_core').on(table.ocid, table.hexaCoreName),
    index('idx_ocid').on(table.ocid),
  ]
);

// 7. character_hexa_stats
export const characterHexaStats = mysqlTable(
  'character_hexa_stats',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    slotId: varchar('slot_id', { length: 10 }).notNull(),
    mainStatName: varchar('main_stat_name', { length: 50 }),
    subStatName1: varchar('sub_stat_name_1', { length: 50 }),
    subStatName2: varchar('sub_stat_name_2', { length: 50 }),
    mainStatLevel: int('main_stat_level').default(0),
    subStatLevel1: int('sub_stat_level_1').default(0),
    subStatLevel2: int('sub_stat_level_2').default(0),
    statGrade: int('stat_grade').default(0),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_slot').on(table.ocid, table.slotId),
    index('idx_ocid').on(table.ocid),
  ]
);

// 8. character_symbols
export const characterSymbols = mysqlTable(
  'character_symbols',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    symbolName: varchar('symbol_name', { length: 100 }).notNull(),
    symbolIcon: text('symbol_icon'),
    symbolLevel: int('symbol_level').default(0),
    symbolForce: int('symbol_force').default(0),
    symbolGrowthCount: int('symbol_growth_count').default(0),
    symbolRequireGrowthCount: int('symbol_require_growth_count').default(0),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_symbol').on(table.ocid, table.symbolName),
    index('idx_ocid').on(table.ocid),
  ]
);

// 9. character_set_effects
export const characterSetEffects = mysqlTable(
  'character_set_effects',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    setName: varchar('set_name', { length: 100 }).notNull(),
    setLevel: int('set_level').default(0),
    setEffectLevel: int('set_effect_level').default(0),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    uniqueIndex('uk_ocid_set').on(table.ocid, table.setName),
    index('idx_ocid').on(table.ocid),
  ]
);

// 10. character_union
export const characterUnion = mysqlTable('character_union', {
  ocid: varchar('ocid', { length: 64 })
    .primaryKey()
    .references(() => characters.ocid, { onDelete: 'cascade' }),
  unionLevel: int('union_level'),
  unionGrade: varchar('union_grade', { length: 50 }),
  unionArtifactLevel: int('union_artifact_level'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// 11. character_union_artifacts
export const characterUnionArtifacts = mysqlTable(
  'character_union_artifacts',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    crystalName: varchar('crystal_name', { length: 100 }),
    crystalLevel: int('crystal_level'),
    crystalType: varchar('crystal_type', { length: 50 }),
    isPrimary: boolean('is_primary').default(false),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);

// 12. character_cash_equipment
export const characterCashEquipment = mysqlTable(
  'character_cash_equipment',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    cashItemName: varchar('cash_item_name', { length: 200 }),
    cashItemIcon: text('cash_item_icon'),
    cashItemEquipmentSlot: varchar('cash_item_equipment_slot', { length: 20 }),
    cashItemOption: json('cash_item_option'),
    dateExpire: timestamp('date_expire'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);

// 13. character_pet_equipment
export const characterPetEquipment = mysqlTable(
  'character_pet_equipment',
  {
    id: bigint('id', { mode: 'number' }).autoincrement().primaryKey(),
    ocid: varchar('ocid', { length: 64 })
      .notNull()
      .references(() => characters.ocid, { onDelete: 'cascade' }),
    petName: varchar('pet_name', { length: 100 }),
    petIcon: text('pet_icon'),
    petEquipmentSlot: varchar('pet_equipment_slot', { length: 20 }),
    petTotalOption: json('pet_total_option'),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_ocid').on(table.ocid)]
);
```

- [ ] **Step 2: Commit**

```bash
git add lib/db/schema.js
git commit -m "feat: add Drizzle schema for all 13 database tables"
```

---

### Task 3: DB Connection + Push Schema

**Files:**
- Create: `lib/db/index.js`

- [ ] **Step 1: Create lib/db/index.js**

```js
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

let db;
let pool;

export function getDb() {
  if (!db) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'maple_hub',
      password: process.env.DB_PASSWORD || 'maple_hub',
      database: process.env.DB_NAME || 'maple_hub',
      waitForConnections: true,
      connectionLimit: 10,
    });
    db = drizzle(pool, { schema, mode: 'default' });
  }
  return db;
}

export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
```

- [ ] **Step 2: Push schema to local MySQL**

```bash
npx drizzle-kit push
```

Expected: Tables created in `maple_hub` database. Verify with:
```bash
docker exec maple-hub-mysql-1 mysql -u maple_hub -pmaple_hub maple_hub -e "SHOW TABLES;"
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/index.js
git commit -m "feat: add Drizzle DB connection with mysql2 pool"
```

---

### Task 4: Redis Client

**Files:**
- Create: `lib/redis.js`

- [ ] **Step 1: Create lib/redis.js**

```js
import Redis from 'ioredis';

let redis;

export function getRedis() {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.connect().catch(err => {
      console.error('Redis connection error:', err.message);
    });
  }
  return redis;
}

// OCID buffer operations
export async function bufferOcid(ocid) {
  const r = getRedis();
  await r.sadd('ocid:buffer', ocid);
}

export async function flushOcidBuffer() {
  const r = getRedis();
  // Use rename + smembers for atomic flush (avoids race condition)
  const tempKey = `ocid:buffer:flush:${Date.now()}`;
  try {
    await r.rename('ocid:buffer', tempKey);
  } catch {
    // Key doesn't exist — no buffered OCIDs
    return [];
  }
  const ocids = await r.smembers(tempKey);
  await r.del(tempKey);
  return ocids;
}

export async function isOcidKnown(ocid) {
  const r = getRedis();
  const exists = await r.exists(`ocid:exists:${ocid}`);
  return exists === 1;
}

export async function markOcidKnown(ocid) {
  const r = getRedis();
  await r.set(`ocid:exists:${ocid}`, '1', 'EX', 3600); // 1 hour TTL
}

// Generic cache operations
export async function getCached(key) {
  const r = getRedis();
  const val = await r.get(key);
  return val ? JSON.parse(val) : null;
}

export async function setCache(key, data, ttlSeconds) {
  const r = getRedis();
  await r.set(key, JSON.stringify(data), 'EX', ttlSeconds);
}

export async function closeRedis() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
```

- [ ] **Step 2: Verify Redis connection**

```bash
node -e "
import { getRedis, closeRedis } from './lib/redis.js';
const r = getRedis();
await r.ping().then(r => console.log('Redis:', r));
await closeRedis();
"
```

Expected: `Redis: PONG`

- [ ] **Step 3: Commit**

```bash
git add lib/redis.js
git commit -m "feat: add Redis client with OCID buffer and cache operations"
```

---

## Chunk 2: Core Services — DB Queries, Nexon API, Sync Service

### Task 5: DB Query Functions

**Files:**
- Create: `lib/db/queries.js`

- [ ] **Step 1: Create lib/db/queries.js**

This file provides all CRUD operations used by the app. Key functions:

```js
import { eq, desc, like, and, sql } from 'drizzle-orm';
import { getDb } from './index.js';
import {
  characters,
  characterStats,
  characterEquipment,
  characterHyperStats,
  characterHyperStatPresets,
  characterLinkSkills,
  characterLinkSkillPresets,
  characterHexaCores,
  characterHexaStats,
  characterSymbols,
  characterSetEffects,
  characterUnion,
  characterUnionArtifacts,
  characterCashEquipment,
  characterPetEquipment,
} from './schema.js';

// --- Characters ---

export async function upsertCharacter(data) {
  const db = getDb();
  await db
    .insert(characters)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        characterName: data.characterName,
        characterLevel: data.characterLevel,
        characterClass: data.characterClass,
        worldName: data.worldName,
        characterImage: data.characterImage,
        characterExpRate: data.characterExpRate,
        characterGender: data.characterGender,
        characterGuildName: data.characterGuildName,
        combatPower: data.combatPower,
        status: data.status || 'success',
        notFoundCount: data.notFoundCount || 0,
        updatedAt: sql`NOW()`,
      },
    });
}

export async function upsertCharacters(dataArray) {
  for (const data of dataArray) {
    await upsertCharacter(data);
  }
}

export async function getCharacterByOcid(ocid) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(characters)
    .where(eq(characters.ocid, ocid))
    .limit(1);
  return row || null;
}

export async function getAllOcids() {
  const db = getDb();
  const rows = await db
    .select({ ocid: characters.ocid })
    .from(characters)
    .where(eq(characters.status, 'success'));
  return rows.map(r => r.ocid);
}

export async function incrementNotFoundCount(ocid) {
  const db = getDb();
  await db
    .update(characters)
    .set({
      status: 'not_found',
      notFoundCount: sql`not_found_count + 1`,
    })
    .where(eq(characters.ocid, ocid));
}

export async function deleteStaleCharacters(maxNotFoundCount = 3) {
  const db = getDb();
  const result = await db
    .delete(characters)
    .where(
      sql`not_found_count >= ${maxNotFoundCount}`
    );
  return result[0]?.affectedRows || 0;
}

// --- Character Stats ---

export async function upsertCharacterStats(data) {
  const db = getDb();
  await db
    .insert(characterStats)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        str: data.str,
        dex: data.dex,
        intStat: data.intStat,
        luk: data.luk,
        attackPower: data.attackPower,
        magicPower: data.magicPower,
        bossDamage: data.bossDamage,
        criticalDamage: data.criticalDamage,
        ignoreDefense: data.ignoreDefense,
        damage: data.damage,
        finalDamage: data.finalDamage,
        allStats: data.allStats,
        updatedAt: sql`NOW()`,
      },
    });
}

// --- Leaderboard ---

export async function getLeaderboard({
  offset = 0,
  limit = 20,
  search,
  worldName,
  characterClass,
} = {}) {
  const db = getDb();
  const conditions = [eq(characters.status, 'success')];

  if (search) {
    conditions.push(like(characters.characterName, `%${search}%`));
  }
  if (worldName) {
    conditions.push(eq(characters.worldName, worldName));
  }
  if (characterClass) {
    conditions.push(like(characters.characterClass, `%${characterClass}%`));
  }

  const where = and(...conditions);

  const [entries, countResult] = await Promise.all([
    db
      .select()
      .from(characters)
      .where(where)
      .orderBy(desc(characters.combatPower))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql`COUNT(*)` })
      .from(characters)
      .where(where),
  ]);

  const totalCount = Number(countResult[0]?.count || 0);

  return {
    entries: entries.map((entry, i) => ({
      rank: offset + i + 1,
      ocid: entry.ocid,
      combat_power: entry.combatPower,
      updated_at: entry.updatedAt,
      character_name: entry.characterName,
      character_level: entry.characterLevel,
      character_image: entry.characterImage,
      world_name: entry.worldName,
      character_class: entry.characterClass,
    })),
    totalCount,
    hasMore: offset + limit < totalCount,
  };
}

export async function getFilterOptions() {
  const db = getDb();
  const [worlds, classes] = await Promise.all([
    db
      .selectDistinct({ worldName: characters.worldName })
      .from(characters)
      .where(eq(characters.status, 'success')),
    db
      .selectDistinct({ characterClass: characters.characterClass })
      .from(characters)
      .where(eq(characters.status, 'success')),
  ]);

  return {
    worlds: worlds
      .map(r => r.worldName)
      .filter(Boolean)
      .sort(),
    classes: classes
      .map(r => r.characterClass)
      .filter(Boolean)
      .sort(),
  };
}

// --- Bulk upsert helpers for sync service ---

export async function upsertEquipment(ocid, presetNo, items) {
  const db = getDb();
  // Delete existing items for this preset then insert fresh
  await db
    .delete(characterEquipment)
    .where(
      and(
        eq(characterEquipment.ocid, ocid),
        eq(characterEquipment.presetNo, presetNo)
      )
    );

  if (items.length === 0) return;

  await db.insert(characterEquipment).values(
    items.map(item => ({
      ocid,
      presetNo,
      itemEquipmentSlot: item.item_equipment_slot,
      itemEquipmentPart: item.item_equipment_part || null,
      itemName: item.item_name,
      itemIcon: item.item_icon,
      itemLevel: parseInt(item.item_level) || null,
      starforce: parseInt(item.starforce) || 0,
      scrollUpgrade: parseInt(item.scroll_upgrade) || 0,
      potentialOptionGrade: item.potential_option_grade || null,
      potentialOption1: item.potential_option_1 || null,
      potentialOption2: item.potential_option_2 || null,
      potentialOption3: item.potential_option_3 || null,
      additionalPotentialOptionGrade:
        item.additional_potential_option_grade || null,
      additionalPotentialOption1:
        item.additional_potential_option_1 || null,
      additionalPotentialOption2:
        item.additional_potential_option_2 || null,
      additionalPotentialOption3:
        item.additional_potential_option_3 || null,
      itemTotalOption: item.item_total_option || null,
      itemBaseOption: item.item_base_option || null,
      itemStarforceOption: item.item_starforce_option || null,
      itemAddOption: item.item_add_option || null,
      itemEtcOption: item.item_etc_option || null,
    }))
  );
}

export async function upsertHyperStats(ocid, presetNo, stats) {
  const db = getDb();
  for (const stat of stats) {
    await db
      .insert(characterHyperStats)
      .values({
        ocid,
        presetNo,
        statType: stat.stat_type,
        statLevel: stat.stat_level || 0,
        statIncrease: stat.stat_increase || null,
      })
      .onDuplicateKeyUpdate({
        set: {
          statLevel: stat.stat_level || 0,
          statIncrease: stat.stat_increase || null,
          updatedAt: sql`NOW()`,
        },
      });
  }
}

export async function upsertHyperStatPreset(ocid, usePresetNo) {
  const db = getDb();
  await db
    .insert(characterHyperStatPresets)
    .values({ ocid, usePresetNo })
    .onDuplicateKeyUpdate({
      set: { usePresetNo, updatedAt: sql`NOW()` },
    });
}

export async function upsertLinkSkills(ocid, presetNo, skills) {
  const db = getDb();
  // Delete old skills for this preset, insert fresh
  await db
    .delete(characterLinkSkills)
    .where(
      and(
        eq(characterLinkSkills.ocid, ocid),
        eq(characterLinkSkills.presetNo, presetNo)
      )
    );

  if (skills.length === 0) return;

  await db.insert(characterLinkSkills).values(
    skills.map(s => ({
      ocid,
      presetNo,
      skillName: s.skill_name,
      skillDescription: s.skill_description || null,
      skillEffect: s.skill_effect || null,
      skillLevel: s.skill_level || null,
    }))
  );
}

export async function upsertLinkSkillPreset(ocid, usePresetNo) {
  const db = getDb();
  await db
    .insert(characterLinkSkillPresets)
    .values({ ocid, usePresetNo })
    .onDuplicateKeyUpdate({
      set: { usePresetNo, updatedAt: sql`NOW()` },
    });
}

export async function upsertHexaCores(ocid, cores) {
  const db = getDb();
  // Delete old, insert fresh
  await db.delete(characterHexaCores).where(eq(characterHexaCores.ocid, ocid));
  if (cores.length === 0) return;

  await db.insert(characterHexaCores).values(
    cores.map(c => ({
      ocid,
      hexaCoreName: c.hexa_core_name,
      hexaCoreLevel: c.hexa_core_level || 0,
      hexaCoreType: c.hexa_core_type || null,
    }))
  );
}

export async function upsertHexaStats(ocid, statCores) {
  const db = getDb();
  for (const core of statCores) {
    await db
      .insert(characterHexaStats)
      .values({
        ocid,
        slotId: core.slot_id,
        mainStatName: core.main_stat_name || null,
        subStatName1: core.sub_stat_name_1 || null,
        subStatName2: core.sub_stat_name_2 || null,
        mainStatLevel: core.main_stat_level || 0,
        subStatLevel1: core.sub_stat_level_1 || 0,
        subStatLevel2: core.sub_stat_level_2 || 0,
        statGrade: core.stat_grade || 0,
      })
      .onDuplicateKeyUpdate({
        set: {
          mainStatName: core.main_stat_name || null,
          subStatName1: core.sub_stat_name_1 || null,
          subStatName2: core.sub_stat_name_2 || null,
          mainStatLevel: core.main_stat_level || 0,
          subStatLevel1: core.sub_stat_level_1 || 0,
          subStatLevel2: core.sub_stat_level_2 || 0,
          statGrade: core.stat_grade || 0,
          updatedAt: sql`NOW()`,
        },
      });
  }
}

export async function upsertSymbols(ocid, symbols) {
  const db = getDb();
  await db.delete(characterSymbols).where(eq(characterSymbols.ocid, ocid));
  if (symbols.length === 0) return;

  await db.insert(characterSymbols).values(
    symbols.map(s => ({
      ocid,
      symbolName: s.symbol_name,
      symbolIcon: s.symbol_icon || null,
      symbolLevel: parseInt(s.symbol_level) || 0,
      symbolForce: s.symbol_force || 0,
      symbolGrowthCount: s.symbol_growth_count || 0,
      symbolRequireGrowthCount: s.symbol_require_growth_count || 0,
    }))
  );
}

export async function upsertSetEffects(ocid, effects) {
  const db = getDb();
  await db
    .delete(characterSetEffects)
    .where(eq(characterSetEffects.ocid, ocid));
  if (effects.length === 0) return;

  await db.insert(characterSetEffects).values(
    effects.map(e => ({
      ocid,
      setName: e.set_name,
      setLevel: e.set_level || 0,
      setEffectLevel: e.set_effect_level || 0,
    }))
  );
}

export async function upsertUnion(ocid, data) {
  const db = getDb();
  await db
    .insert(characterUnion)
    .values({
      ocid,
      unionLevel: data.union_level || null,
      unionGrade: data.union_grade || null,
      unionArtifactLevel: data.union_artifact_level || null,
    })
    .onDuplicateKeyUpdate({
      set: {
        unionLevel: data.union_level || null,
        unionGrade: data.union_grade || null,
        unionArtifactLevel: data.union_artifact_level || null,
        updatedAt: sql`NOW()`,
      },
    });
}

export async function upsertUnionArtifacts(ocid, crystals) {
  const db = getDb();
  await db
    .delete(characterUnionArtifacts)
    .where(eq(characterUnionArtifacts.ocid, ocid));
  if (!crystals || crystals.length === 0) return;

  await db.insert(characterUnionArtifacts).values(
    crystals.map(c => ({
      ocid,
      crystalName: c.name || null,
      crystalLevel: c.level || null,
      crystalType: c.crystal_type || null,
      isPrimary: c.primary || false,
    }))
  );
}

export async function upsertCashEquipment(ocid, items) {
  const db = getDb();
  await db
    .delete(characterCashEquipment)
    .where(eq(characterCashEquipment.ocid, ocid));
  if (!items || items.length === 0) return;

  await db.insert(characterCashEquipment).values(
    items.map(item => ({
      ocid,
      cashItemName: item.cash_item_name || null,
      cashItemIcon: item.cash_item_icon || null,
      cashItemEquipmentSlot: item.cash_item_equipment_slot || null,
      cashItemOption: item.cash_item_option || null,
      dateExpire: item.date_expire ? new Date(item.date_expire) : null,
    }))
  );
}

export async function upsertPetEquipment(ocid, pets) {
  const db = getDb();
  await db
    .delete(characterPetEquipment)
    .where(eq(characterPetEquipment.ocid, ocid));
  if (!pets || pets.length === 0) return;

  await db.insert(characterPetEquipment).values(
    pets.map(p => ({
      ocid,
      petName: p.pet_name || null,
      petIcon: p.pet_icon || null,
      petEquipmentSlot: p.pet_equipment_slot || null,
      petTotalOption: p.pet_total_option || null,
    }))
  );
}
```

- [ ] **Step 2: Test DB connection + basic upsert manually**

```bash
node -e "
import { getDb, closeDb } from './lib/db/index.js';
import { upsertCharacter, getCharacterByOcid } from './lib/db/queries.js';

await upsertCharacter({
  ocid: 'test-ocid-001',
  characterName: 'TestChar',
  characterLevel: 250,
  characterClass: '劍士',
  worldName: '殺人鯨',
  combatPower: 1000000,
  status: 'success',
});
const char = await getCharacterByOcid('test-ocid-001');
console.log('Inserted:', char);
await closeDb();
"
```

Expected: Character record printed.

- [ ] **Step 3: Clean up test data**

```bash
docker exec maple-hub-mysql-1 mysql -u maple_hub -pmaple_hub maple_hub -e "DELETE FROM characters WHERE ocid = 'test-ocid-001';"
```

- [ ] **Step 4: Commit**

```bash
git add lib/db/queries.js
git commit -m "feat: add DB query functions for all 13 tables"
```

---

### Task 6: Consolidate Nexon API Endpoints

**Files:**
- Modify: `lib/nexonApi.js`

Add the 3 missing endpoints (#8 hexamatrix, #9 hexamatrix-stat, #11 symbol-equipment):

- [ ] **Step 1: Add missing exports to lib/nexonApi.js**

Add after the existing exports:

```js
const TWMS_API_BASE_URL = 'https://open.api.nexon.com/maplestorytw/v1';

const twmsApiClient = axios.create({
  baseURL: TWMS_API_BASE_URL,
  headers: {
    accept: 'application/json',
    'x-nxopen-api-key': API_KEY,
  },
});

export const getCharacterHexaMatrix = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/hexamatrix?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch hexa matrix: ${error.message}`);
  }
};

export const getCharacterHexaMatrixStat = async ocid => {
  try {
    const response = await apiClient.get(
      `/character/hexamatrix-stat?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch hexa matrix stat: ${error.message}`);
  }
};

export const getCharacterSymbolEquipment = async ocid => {
  try {
    const response = await twmsApiClient.get(
      `/character/symbol-equipment?ocid=${ocid}`
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch symbol equipment: ${error.message}`);
  }
};

export const getCharacterUnion = async ocid => {
  try {
    const response = await apiClient.get(`/user/union?ocid=${ocid}`);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch union data: ${error.message}`);
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/nexonApi.js
git commit -m "feat: consolidate all Nexon API endpoints into nexonApi.js"
```

---

### Task 7: Character Sync Service

**Files:**
- Create: `lib/characterSyncService.js`

This service fetches ALL 13 endpoints for a character and upserts to DB.

- [ ] **Step 1: Create lib/characterSyncService.js**

```js
import {
  getCharacterBasicInfo,
  getCharacterStats,
  getCharacterEquipment,
  getCharacterCashItemEquipment,
  getCharacterPetEquipment,
  getCharacterHyperStat,
  getCharacterLinkSkill,
  getCharacterHexaMatrix,
  getCharacterHexaMatrixStat,
  getCharacterSetEffect,
  getCharacterSymbolEquipment,
  getUnionRaider,
  getUnionArtifact,
} from './nexonApi.js';
import {
  upsertCharacter,
  upsertCharacterStats,
  upsertEquipment,
  upsertHyperStats,
  upsertHyperStatPreset,
  upsertLinkSkills,
  upsertLinkSkillPreset,
  upsertHexaCores,
  upsertHexaStats,
  upsertSymbols,
  upsertSetEffects,
  upsertUnion,
  upsertUnionArtifacts,
  upsertCashEquipment,
  upsertPetEquipment,
  incrementNotFoundCount,
} from './db/queries.js';

const CONCURRENCY = 10;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parse stat value from Nexon's final_stat array
 */
function parseStatValue(finalStat, ...names) {
  for (const name of names) {
    const stat = finalStat.find(s => s.stat_name === name);
    if (stat) return parseFloat(stat.stat_value) || 0;
  }
  return 0;
}

/**
 * Sync a single character — fetch all endpoints + upsert to DB.
 * Returns { success: boolean, ocid: string, error?: string }
 */
export async function syncCharacter(ocid) {
  try {
    // Fetch basic info first to check if character exists
    let basicInfo;
    try {
      basicInfo = await getCharacterBasicInfo(ocid);
    } catch (err) {
      if (err.message?.includes('404') || err.response?.status === 404) {
        await incrementNotFoundCount(ocid);
        return { success: false, ocid, status: 'not_found' };
      }
      throw err;
    }

    // Fetch remaining endpoints in parallel (grouped to respect rate limits)
    const [
      statData,
      equipData,
      cashData,
      petData,
      hyperData,
      linkData,
      hexaData,
      hexaStatData,
      setData,
      symbolData,
      unionData,
      artifactData,
    ] = await Promise.allSettled([
      getCharacterStats(ocid),
      getCharacterEquipment(ocid),
      getCharacterCashItemEquipment(ocid),
      getCharacterPetEquipment(ocid),
      getCharacterHyperStat(ocid),
      getCharacterLinkSkill(ocid),
      getCharacterHexaMatrix(ocid),
      getCharacterHexaMatrixStat(ocid),
      getCharacterSetEffect(ocid),
      getCharacterSymbolEquipment(ocid),
      getUnionRaider(ocid),
      getUnionArtifact(ocid),
    ]);

    const val = r => (r.status === 'fulfilled' ? r.value : null);

    // 1. Upsert character basic info + combat power
    const stats = val(statData);
    const combatPower = stats
      ? parseStatValue(stats.final_stat || [], '戰鬥力', '전투력')
      : null;

    await upsertCharacter({
      ocid,
      characterName: basicInfo.character_name,
      characterLevel: basicInfo.character_level,
      characterClass: basicInfo.character_class,
      worldName: basicInfo.world_name,
      characterImage: basicInfo.character_image,
      characterExpRate: basicInfo.character_exp_rate || null,
      characterGender: basicInfo.character_gender || null,
      characterGuildName: basicInfo.character_guild_name || null,
      combatPower,
      status: 'success',
      notFoundCount: 0,
    });

    // 2. Upsert stats
    if (stats) {
      const fs = stats.final_stat || [];
      await upsertCharacterStats({
        ocid,
        str: parseStatValue(fs, 'STR'),
        dex: parseStatValue(fs, 'DEX'),
        intStat: parseStatValue(fs, 'INT'),
        luk: parseStatValue(fs, 'LUK'),
        attackPower: parseStatValue(fs, '攻擊力', '공격력'),
        magicPower: parseStatValue(fs, '魔法攻擊力', '마력'),
        bossDamage: parseStatValue(
          fs,
          'BOSS怪物傷害',
          'Boss攻擊時傷害',
          'Boss 攻擊時傷害',
          '보스 몬스터 공격 시 데미지'
        ),
        criticalDamage: parseStatValue(fs, '爆擊傷害', '크리티컬 데미지'),
        ignoreDefense: parseStatValue(
          fs,
          '無視防禦率',
          '無視防禦',
          '防禦無視',
          '방어율 무시'
        ),
        damage: parseStatValue(fs, '傷害'),
        finalDamage: parseStatValue(fs, '最終傷害'),
        allStats: fs,
      });
    }

    // 3. Upsert equipment (3 presets)
    const equip = val(equipData);
    if (equip) {
      for (let p = 1; p <= 3; p++) {
        const key =
          p === 1
            ? 'item_equipment_preset_1'
            : p === 2
              ? 'item_equipment_preset_2'
              : 'item_equipment_preset_3';
        const items = equip[key] || [];
        if (items.length > 0) {
          await upsertEquipment(ocid, p, items);
        }
      }
    }

    // 4. Upsert HyperStat
    const hyper = val(hyperData);
    if (hyper) {
      const presetNo = parseInt(hyper.use_preset_no) || 1;
      await upsertHyperStatPreset(ocid, presetNo);
      for (let p = 1; p <= 3; p++) {
        const stats = hyper[`hyper_stat_preset_${p}`] || [];
        if (stats.length > 0) {
          await upsertHyperStats(ocid, p, stats);
        }
      }
    }

    // 5. Upsert Link Skills
    const link = val(linkData);
    if (link) {
      const presetNo = parseInt(link.use_preset_no) || 1;
      await upsertLinkSkillPreset(ocid, presetNo);
      for (let p = 1; p <= 3; p++) {
        const skills = link[`character_link_skill_preset_${p}`] || [];
        if (skills.length > 0) {
          await upsertLinkSkills(ocid, p, skills);
        }
      }
    }

    // 6. Upsert Hexa cores
    const hexa = val(hexaData);
    if (hexa && hexa.character_hexa_core) {
      await upsertHexaCores(ocid, hexa.character_hexa_core);
    }

    // 7. Upsert Hexa stats
    const hexaStat = val(hexaStatData);
    if (hexaStat && hexaStat.character_hexa_stat_core) {
      await upsertHexaStats(ocid, hexaStat.character_hexa_stat_core);
    }

    // 8. Upsert Symbols
    const symbols = val(symbolData);
    if (symbols && symbols.symbol) {
      await upsertSymbols(ocid, symbols.symbol);
    }

    // 9. Upsert Set Effects
    const sets = val(setData);
    if (sets && sets.set_effect) {
      await upsertSetEffects(ocid, sets.set_effect);
    }

    // 10. Upsert Union
    const union = val(unionData);
    if (union) {
      await upsertUnion(ocid, union);
    }

    // 11. Upsert Union Artifacts
    const artifact = val(artifactData);
    if (artifact && artifact.union_artifact_crystal) {
      await upsertUnionArtifacts(ocid, artifact.union_artifact_crystal);
    }

    // 12. Upsert Cash Equipment
    const cash = val(cashData);
    if (cash && cash.cash_item_equipment_base) {
      await upsertCashEquipment(ocid, cash.cash_item_equipment_base);
    }

    // 13. Upsert Pet Equipment
    const pet = val(petData);
    if (pet && pet.pet_equipment) {
      await upsertPetEquipment(ocid, pet.pet_equipment);
    }

    return { success: true, ocid };
  } catch (error) {
    console.error(`Failed to sync ${ocid}:`, error.message);
    return { success: false, ocid, status: 'error', error: error.message };
  }
}

/**
 * Sync all characters in batches with concurrency control.
 */
export async function syncAllCharacters(ocids, { concurrency = CONCURRENCY } = {}) {
  const stats = { success: 0, failed: 0, notFound: 0, total: ocids.length };
  const startTime = Date.now();

  // Process in chunks
  for (let i = 0; i < ocids.length; i += concurrency) {
    const batch = ocids.slice(i, i + concurrency);
    const results = await Promise.all(batch.map(ocid => syncCharacter(ocid)));

    for (const r of results) {
      if (r.success) stats.success++;
      else if (r.status === 'not_found') stats.notFound++;
      else stats.failed++;
    }

    console.log(
      `Sync progress: ${i + batch.length}/${ocids.length} ` +
        `(success: ${stats.success}, failed: ${stats.failed}, notFound: ${stats.notFound})`
    );
  }

  stats.executionTimeMs = Date.now() - startTime;
  return stats;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/characterSyncService.js
git commit -m "feat: add character sync service for all 13 Nexon API endpoints"
```

---

## Chunk 3: API Routes Refactoring + Cron

### Task 8: Refactor API Routes

**Files:**
- Modify: `app/api/character/stats/route.js`
- Modify: `app/api/leaderboard/route.js`
- Modify: `app/api/leaderboard/filters/route.js`
- Modify: `app/api/sync-ocids/route.js`
- Modify: `app/api/hexa-matrix/route.js`
- Modify: `app/api/hexa-matrix-stat/route.js`
- Modify: `app/api/character/[ocid]/runes/route.js`

- [ ] **Step 1: Refactor character/stats/route.js**

Replace GoogleSheets+ocidLogger imports with Redis:

```js
import { NextResponse } from 'next/server';
import { getCharacterStats } from '../../../../lib/nexonApi';
import { getCachedData, setCachedData } from '../../../../lib/cache';
import { handleApiError } from '../../../../lib/apiErrorHandler';
import { bufferOcid, isOcidKnown, markOcidKnown } from '../../../../lib/redis.js';

async function recordOcidAsync(ocid) {
  try {
    const known = await isOcidKnown(ocid);
    if (!known) {
      await bufferOcid(ocid);
      await markOcidKnown(ocid);
    }
  } catch (error) {
    console.error('❌ OCID 記錄失敗:', error);
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ocid = searchParams.get('ocid');

    if (!ocid) {
      return NextResponse.json(
        { error: 'OCID parameter is required' },
        { status: 400 }
      );
    }

    recordOcidAsync(ocid);

    const cacheKey = `stats_${ocid}`;
    let data = getCachedData(cacheKey);

    if (!data) {
      data = await getCharacterStats(ocid);
      setCachedData(cacheKey, data);
    }

    return NextResponse.json(data);
  } catch (error) {
    const apiError = handleApiError(error);
    return NextResponse.json(
      { error: apiError.message },
      { status: apiError.status || 500 }
    );
  }
}
```

- [ ] **Step 2: Refactor leaderboard/route.js**

Replace entire file — use SQL queries with Redis cache:

```js
import { NextResponse } from 'next/server';
import { getLeaderboard } from '../../../lib/db/queries.js';
import { getCached, setCache } from '../../../lib/redis.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    let offset = parseInt(searchParams.get('offset') || '0', 10);
    let limit = parseInt(searchParams.get('limit') || '20', 10);

    if (isNaN(offset) || offset < 0) offset = 0;
    if (isNaN(limit) || limit < 1) limit = 20;
    else if (limit > 100) limit = 100;

    const search = searchParams.get('search') || null;
    const worldName = searchParams.get('worldName') || null;
    const characterClass = searchParams.get('characterClass') || null;
    const hasFilters = !!(search || worldName || characterClass);

    // Try Redis cache for non-filtered first page
    if (!hasFilters && offset === 0 && limit === 20) {
      const cached = await getCached('leaderboard:latest');
      if (cached) return NextResponse.json(cached);
    }

    const result = await getLeaderboard({
      offset,
      limit,
      search,
      worldName,
      characterClass,
    });

    const response = {
      entries: result.entries,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
      offset,
      limit,
    };

    // Cache default first page
    if (!hasFilters && offset === 0 && limit === 20) {
      setCache('leaderboard:latest', response, 600).catch(() => {});
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Refactor leaderboard/filters/route.js**

```js
import { NextResponse } from 'next/server';
import { getFilterOptions } from '../../../../lib/db/queries.js';
import { getCached, setCache } from '../../../../lib/redis.js';

export async function GET() {
  try {
    const cached = await getCached('leaderboard:filters');
    if (cached) return NextResponse.json(cached);

    const filters = await getFilterOptions();

    setCache('leaderboard:filters', filters, 1800).catch(() => {});

    return NextResponse.json(filters);
  } catch (error) {
    console.error('❌ Leaderboard filters API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Refactor sync-ocids/route.js**

```js
import { NextResponse } from 'next/server';
import { flushOcidBuffer } from '../../../lib/redis.js';
import { upsertCharacters } from '../../../lib/db/queries.js';

export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const ocids = await flushOcidBuffer();

    if (ocids.length === 0) {
      return NextResponse.json({ message: 'No new OCIDs to sync', count: 0 });
    }

    await upsertCharacters(
      ocids.map(ocid => ({
        ocid,
        status: 'success',
        notFoundCount: 0,
      }))
    );

    return NextResponse.json({
      message: `Synced ${ocids.length} OCIDs`,
      count: ocids.length,
    });
  } catch (error) {
    console.error('❌ Sync OCIDs error:', error);
    return NextResponse.json(
      { error: 'Failed to sync OCIDs' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  return GET(request);
}
```

- [ ] **Step 5: Refactor hexa-matrix routes to use nexonApi.js**

`app/api/hexa-matrix/route.js` — full replacement:
```js
import { getCharacterHexaMatrix } from '../../../lib/nexonApi';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ocid = searchParams.get('ocid');

  if (!ocid) {
    return Response.json(
      { error: 'Character OCID is required' },
      { status: 400 }
    );
  }

  try {
    const data = await getCharacterHexaMatrix(ocid);
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching Hexa Matrix data:', error.message);
    return Response.json(
      { error: 'Failed to fetch Hexa Matrix data' },
      { status: 500 }
    );
  }
}
```

`app/api/hexa-matrix-stat/route.js` — full replacement (preserves combinedCores transformation):
```js
import { getCharacterHexaMatrixStat } from '../../../lib/nexonApi';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ocid = searchParams.get('ocid');

  if (!ocid) {
    return Response.json(
      { error: 'Character OCID is required' },
      { status: 400 }
    );
  }

  try {
    const data = await getCharacterHexaMatrixStat(ocid);

    // Combine all hexa stat core arrays
    const combinedCores = [];
    Object.keys(data).forEach(key => {
      if (
        key.includes('hexa_stat_core') &&
        !key.startsWith('preset_') &&
        Array.isArray(data[key])
      ) {
        combinedCores.push(...data[key]);
      }
    });

    return Response.json({
      ...data,
      character_hexa_stat_core: combinedCores,
    });
  } catch (error) {
    console.error('Error fetching Hexa Matrix Stat data:', error.message);
    return Response.json(
      { error: 'Failed to fetch Hexa Matrix Stat data' },
      { status: 500 }
    );
  }
}
```

`app/api/character/[ocid]/runes/route.js` — replace hardcoded URL with:
```js
import { getCharacterSymbolEquipment } from '../../../../lib/nexonApi';

export async function GET(request, { params }) {
  const { ocid } = await params;
  try {
    const data = await getCharacterSymbolEquipment(ocid);
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching rune data:', error.message);
    return Response.json(
      { error: 'Failed to fetch rune data' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add app/api/character/stats/route.js app/api/leaderboard/route.js \
  app/api/leaderboard/filters/route.js app/api/sync-ocids/route.js \
  app/api/hexa-matrix/route.js app/api/hexa-matrix-stat/route.js \
  app/api/character/\[ocid\]/runes/route.js
git commit -m "refactor: replace Google Sheets with DB/Redis in all API routes"
```

---

### Task 9: Refactor Cron Routes + Add node-cron

**Files:**
- Modify: `app/api/cron/refresh-all/route.js`
- Create: `lib/cron.js`
- Create: `instrumentation.js`
- Create: `app/api/health/route.js`

- [ ] **Step 1: Rewrite refresh-all/route.js**

```js
import { NextResponse } from 'next/server';
import { getAllOcids, deleteStaleCharacters } from '../../../../lib/db/queries.js';
import { syncAllCharacters } from '../../../../lib/characterSyncService.js';

const validateAuth = request => {
  const authHeader = request.headers.get('Authorization');
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
};

export async function GET(request) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const ocids = await getAllOcids();

    if (ocids.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No characters to refresh',
        processed: 0,
      });
    }

    const stats = await syncAllCharacters(ocids);

    // Cleanup stale characters
    const deleted = await deleteStaleCharacters(3);

    return NextResponse.json({
      success: true,
      processed: ocids.length,
      stats,
      deletedStale: deleted,
      executionTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error('❌ Refresh-all error:', error);
    return NextResponse.json(
      { error: 'Refresh failed', message: error.message },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create lib/cron.js**

```js
import cron from 'node-cron';

export function initCronJobs() {
  console.log('🕐 Initializing cron jobs...');

  // Sync OCID buffer → DB every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const { flushOcidBuffer } = await import('./redis.js');
      const { upsertCharacters } = await import('./db/queries.js');

      const ocids = await flushOcidBuffer();
      if (ocids.length > 0) {
        await upsertCharacters(
          ocids.map(ocid => ({ ocid, status: 'success', notFoundCount: 0 }))
        );
        console.log(`✅ Synced ${ocids.length} buffered OCIDs`);
      }
    } catch (error) {
      console.error('❌ OCID sync cron error:', error);
    }
  });

  // Refresh all characters every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      const { getAllOcids, deleteStaleCharacters } = await import(
        './db/queries.js'
      );
      const { syncAllCharacters } = await import(
        './characterSyncService.js'
      );

      const ocids = await getAllOcids();
      console.log(`🔄 Starting refresh for ${ocids.length} characters...`);

      const stats = await syncAllCharacters(ocids);
      const deleted = await deleteStaleCharacters(3);

      console.log('✅ Refresh complete:', stats, `Deleted stale: ${deleted}`);
    } catch (error) {
      console.error('❌ Refresh-all cron error:', error);
    }
  });

  // Cleanup stale characters daily at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const { deleteStaleCharacters } = await import('./db/queries.js');
      const deleted = await deleteStaleCharacters(3);
      console.log(`🧹 Cleanup: removed ${deleted} stale characters`);
    } catch (error) {
      console.error('❌ Cleanup cron error:', error);
    }
  });

  console.log('✅ Cron jobs initialized');
}
```

- [ ] **Step 3: Create instrumentation.js**

```js
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initCronJobs } = await import('./lib/cron.js');
    initCronJobs();
  }
}
```

- [ ] **Step 4: Create health check endpoint**

```js
// app/api/health/route.js
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/cron/refresh-all/route.js lib/cron.js instrumentation.js \
  app/api/health/route.js
git commit -m "feat: add node-cron scheduling + rewrite cron routes for MySQL"
```

---

### Task 10: Update envValidation.js

**Files:**
- Modify: `lib/envValidation.js`

- [ ] **Step 1: Replace Google Sheets vars with DB/Redis vars**

Replace the Google Sheets entries in `requiredEnvVars` with:

```js
DB_HOST: {
  description: 'MySQL host',
  required: false,
  validate: value => !value || value.length > 0,
},
DB_PORT: {
  description: 'MySQL port',
  required: false,
  validate: value => !value || !isNaN(parseInt(value)),
},
DB_USER: {
  description: 'MySQL user',
  required: false,
  validate: value => !value || value.length > 0,
},
DB_PASSWORD: {
  description: 'MySQL password',
  required: false,
  validate: value => !value || value.length > 0,
},
DB_NAME: {
  description: 'MySQL database name',
  required: false,
  validate: value => !value || value.length > 0,
},
REDIS_HOST: {
  description: 'Redis host',
  required: false,
  validate: value => !value || value.length > 0,
},
REDIS_PORT: {
  description: 'Redis port',
  required: false,
  validate: value => !value || !isNaN(parseInt(value)),
},
```

Remove all `GOOGLE_SHEETS_*` and `SPREADSHEET_ID` entries.

Also remove the `hasAllGoogleSheetsVars` check block (lines 79-94 in current file):

```js
// DELETE this entire block:
// const hasAllGoogleSheetsVars = [ ... ].every(key => process.env[key]);
// if (!hasAllGoogleSheetsVars) { warnings.push(...) }
```

- [ ] **Step 2: Commit**

```bash
git add lib/envValidation.js
git commit -m "refactor: replace Google Sheets env vars with DB/Redis in validation"
```

---

## Chunk 4: Cleanup, Docker, Migration

### Task 11: Delete Old Files

**Files:**
- Delete: `lib/googleSheets.js`, `lib/ocidLogger.js`, `lib/sharedLogger.js`
- Delete: `vercel.json`
- Delete: `app/api/cron/combat-power-refresh/`, `app/api/cron/update-character-info/`, `app/api/cron/deduplicate-ocid/`
- Delete: `app/api/debug-ocids/`
- Delete: `__tests__/lib/googleSheets.test.js`, `__tests__/lib/googleSheets.combatPower.test.js`

- [ ] **Step 1: Delete deprecated source files**

```bash
rm lib/googleSheets.js lib/ocidLogger.js lib/sharedLogger.js
rm lib/characterInfoService.js lib/combatPowerService.js
rm vercel.json
rm -rf app/api/cron/combat-power-refresh app/api/cron/update-character-info app/api/cron/deduplicate-ocid
rm -rf app/api/debug-ocids
```

- [ ] **Step 2: Delete all broken test files**

```bash
rm -f __tests__/lib/googleSheets.test.js
rm -f __tests__/lib/googleSheets.combatPower.test.js
rm -f __tests__/lib/ocidLogger.test.js
rm -f __tests__/middleware.test.js
rm -f __tests__/api/cron/refreshAll.test.js
rm -f __tests__/api/cron/combatPowerRefresh.test.js
rm -f __tests__/api/syncOcids.test.js
rm -f __tests__/api/leaderboard.test.js
rm -f __tests__/api/leaderboard-filters.test.js
```

- [ ] **Step 3: Verify no broken imports**

```bash
grep -r "googleSheets\|ocidLogger\|sharedLogger\|characterInfoService\|combatPowerService" --include="*.js" lib/ app/ | grep -v node_modules | grep -v ".test.js"
```

Expected: No matches (all imports replaced in previous tasks).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove Google Sheets, ocidLogger, deprecated cron routes, vercel.json"
```

---

### Task 12: Docker Deployment Files

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

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

- [ ] **Step 2: Create docker-compose.yml (production)**

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
      - "traefik.enable=true"
      - "traefik.http.services.maple-hub.loadbalancer.healthcheck.path=/api/health"

networks:
  infra:
    external: true
    name: infra
```

- [ ] **Step 3: Test Docker build locally**

```bash
docker build -t maple-hub:test .
```

Expected: Build succeeds. Verify image size is reasonable (~200-300 MB).

- [ ] **Step 4: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "feat: add Dockerfile and production docker-compose"
```

---

### Task 13: Data Migration Script

**Files:**
- Create: `scripts/migrate-from-sheets.js`

- [ ] **Step 1: Create migration script**

This runs locally (where Google Sheets credentials exist) and outputs SQL.

```js
/**
 * Migration script: Google Sheets → MySQL SQL file
 *
 * Usage: node scripts/migrate-from-sheets.js > migration.sql
 *
 * Requires Google Sheets env vars in .env.local
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      type: 'service_account',
      project_id: process.env.GOOGLE_SHEETS_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SHEETS_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SHEETS_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      client_x509_cert_url: process.env.GOOGLE_SHEETS_CLIENT_X509_CERT_URL,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return auth;
}

function escapeSQL(val) {
  if (val === null || val === undefined || val === '') return 'NULL';
  return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

async function main() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // Read OCID sheet (Sheet1)
  const ocidRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A:A',
  });
  const ocids = (ocidRes.data.values || [])
    .flat()
    .filter(v => v && v !== 'ocid');

  // Read CharacterInfo sheet
  const charRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CharacterInfo!A:G',
  });
  const charRows = (charRes.data.values || []).slice(1); // skip header
  const charMap = new Map();
  for (const row of charRows) {
    charMap.set(row[0], {
      character_name: row[1] || null,
      character_level: parseInt(row[2]) || null,
      character_image: row[3] || null,
      world_name: row[4] || null,
      character_class: row[5] || null,
      cached_at: row[6] || null,
    });
  }

  // Read CombatPower sheet
  const cpRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'CombatPower!A:E',
  });
  const cpRows = (cpRes.data.values || []).slice(1);
  const cpMap = new Map();
  for (const row of cpRows) {
    cpMap.set(row[0], {
      combat_power: parseInt(row[1]) || null,
      updated_at: row[2] || null,
      status: row[3] || 'success',
      not_found_count: parseInt(row[4]) || 0,
    });
  }

  // Output SQL
  console.log('-- Maple Hub Migration from Google Sheets');
  console.log(`-- Generated: ${new Date().toISOString()}`);
  console.log(`-- Total OCIDs: ${ocids.length}`);
  console.log('');

  // Deduplicate OCIDs
  const uniqueOcids = [...new Set(ocids)];

  console.log('START TRANSACTION;');
  console.log('');

  for (const ocid of uniqueOcids) {
    const char = charMap.get(ocid) || {};
    const cp = cpMap.get(ocid) || {};

    console.log(
      `INSERT INTO characters (ocid, character_name, character_level, character_class, world_name, character_image, combat_power, status, not_found_count, created_at, updated_at) VALUES (` +
        `${escapeSQL(ocid)}, ` +
        `${escapeSQL(char.character_name)}, ` +
        `${char.character_level || 'NULL'}, ` +
        `${escapeSQL(char.character_class)}, ` +
        `${escapeSQL(char.world_name)}, ` +
        `${escapeSQL(char.character_image)}, ` +
        `${cp.combat_power || 'NULL'}, ` +
        `${escapeSQL(cp.status || 'success')}, ` +
        `${cp.not_found_count || 0}, ` +
        `NOW(), NOW()` +
        `) ON DUPLICATE KEY UPDATE ` +
        `character_name = VALUES(character_name), ` +
        `character_level = VALUES(character_level), ` +
        `combat_power = VALUES(combat_power);`
    );
  }

  console.log('');
  console.log('COMMIT;');
  console.log(`-- Migration complete: ${uniqueOcids.length} characters`);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Test migration script (dry run)**

```bash
node scripts/migrate-from-sheets.js | head -20
```

Expected: SQL INSERT statements printed.

- [ ] **Step 3: Generate full migration file**

```bash
node scripts/migrate-from-sheets.js > migration.sql
```

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-from-sheets.js
git commit -m "feat: add Google Sheets to MySQL migration script"
```

---

### Task 14: Build Verification

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Fix any lint errors from refactored files.

- [ ] **Step 2: Run tests**

```bash
npm run test
```

Expected: All remaining tests pass. If any test imports deleted modules, delete or fix the test file.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: Build succeeds with standalone output.

- [ ] **Step 4: Test dev server**

```bash
npm run dev
```

Verify:
- `/api/health` returns `{ status: 'ok' }`
- `/api/leaderboard` returns empty results (no data yet)
- `/api/leaderboard/filters` returns empty worlds/classes
- Console shows "Cron jobs initialized"

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve build and lint issues from migration"
```

---

## Deployment Checklist (Manual Steps on Server)

After all tasks are complete:

1. Copy `migration.sql` to server
2. Import: `mysql -u root -p maple_hub < migration.sql`
3. Copy repo to server (or push + pull)
4. Create `.env` on server with production values
5. `docker compose up -d --build`
6. Verify: `curl https://your-domain/api/health`
7. Trigger first full refresh: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/refresh-all`
8. Monitor logs: `docker compose logs -f maple-hub`
