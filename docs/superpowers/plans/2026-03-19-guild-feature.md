# Guild Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add guild browsing and analysis — search guilds, view members with rankings/distributions, and see your position within the guild.

**Architecture:** Nexon Guild API provides guild info + member name list. Members are resolved via OCID lookup + character basic API, synced progressively in the background. Data stored in MySQL (Drizzle), sync status tracked in Redis. Frontend polls for updates and renders progressively.

**Tech Stack:** Next.js 15, Drizzle ORM (MySQL), Redis (ioredis), MUI 7, Tailwind CSS 4, Recharts, node-cron

**Spec:** `docs/superpowers/specs/2026-03-19-guild-feature-design.md`

---

## File Map

### New Files

| File                                                  | Responsibility                                                 |
| ----------------------------------------------------- | -------------------------------------------------------------- |
| `lib/db/guildSchema.js`                               | Drizzle table definitions: guilds, guild_skills, guild_members |
| `lib/db/guildQueries.js`                              | Guild DB operations: upsert, read, member joins                |
| `lib/rateLimiter.js`                                  | Shared token-bucket rate limiter for all Nexon API calls       |
| `lib/guildSyncService.js`                             | Guild member background sync logic                             |
| `app/api/guild/search/route.js`                       | Guild search API endpoint                                      |
| `app/api/guild/[oguildId]/route.js`                   | Guild detail API endpoint                                      |
| `app/api/guild/[oguildId]/sync-status/route.js`       | Sync status polling endpoint                                   |
| `app/guild/page.js`                                   | Guild search page (server component)                           |
| `app/guild/[server]/[guildName]/page.js`              | Guild detail page (server component)                           |
| `app/guild/[server]/[guildName]/GuildDetailClient.js` | Client-side guild detail with polling                          |
| `components/GuildSearch.js`                           | Guild search form component                                    |
| `components/GuildInfoCard.js`                         | Guild info display card                                        |
| `components/GuildMemberTable.js`                      | Member leaderboard table                                       |
| `components/GuildDistributions.js`                    | Class pie chart + level histogram                              |
| `components/GuildMyPosition.js`                       | Personal position panel                                        |
| `components/GuildHighlights.js`                       | Fun guild badges/highlights                                    |
| `components/GuildSyncProgress.js`                     | Sync progress indicator                                        |
| `drizzle/migrations/XXXX_add_guild_tables.sql`        | Migration file                                                 |

### Modified Files

| File                                                 | Change                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| `lib/nexonApi.js`                                    | Add `getCharacterOcid(name)`, `getGuildId()`, `getGuildBasic()` |
| `lib/cron.js`                                        | Add guild refresh cron job                                      |
| `app/character/[name]/page.js` or relevant component | Add clickable guild name link                                   |
| Layout/Navbar component                              | Add `/guild` navigation link                                    |

---

## Task 1: Extract `getCharacterOcid` into nexonApi.js

**Files:**

- Modify: `lib/nexonApi.js`
- Modify: `app/api/character/search/route.js`
- Test: `__tests__/lib/nexonApi.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// __tests__/lib/nexonApi.test.js
import { getCharacterOcid } from '../../lib/nexonApi.js';

// Mock axios at top of file (follow existing test patterns)
jest.mock('axios');

describe('getCharacterOcid', () => {
  it('should return ocid for a valid character name', async () => {
    const { default: axios } = await import('axios');
    axios.create.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        data: { ocid: 'abc123def456' },
      }),
    });

    const result = await getCharacterOcid('TestChar');
    expect(result).toBe('abc123def456');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/lib/nexonApi"`
Expected: FAIL — `getCharacterOcid` is not exported

- [ ] **Step 3: Add `getCharacterOcid` to nexonApi.js**

Add to `lib/nexonApi.js`:

```javascript
export const getCharacterOcid = async characterName => {
  try {
    const response = await apiClient.get(
      `/id?character_name=${encodeURIComponent(characterName)}`
    );
    return response.data.ocid;
  } catch (error) {
    throw new Error(
      `Failed to fetch OCID for "${characterName}": ${error.message}`
    );
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/lib/nexonApi"`
Expected: PASS

- [ ] **Step 5: Update character search route to use new function**

In `app/api/character/search/route.js`, replace the inline OCID lookup with:

```javascript
import { getCharacterOcid } from '../../../lib/nexonApi.js';
// ...
const ocid = await getCharacterOcid(name);
```

- [ ] **Step 6: Run existing tests to verify no regression**

Run: `npm test`
Expected: All existing tests PASS

- [ ] **Step 7: Commit**

```bash
git add lib/nexonApi.js app/api/character/search/route.js __tests__/lib/nexonApi.test.js
git commit -m "refactor: extract getCharacterOcid into nexonApi.js"
```

---

## Task 2: Rate Limiter

**Files:**

- Create: `lib/rateLimiter.js`
- Test: `__tests__/lib/rateLimiter.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// __tests__/lib/rateLimiter.test.js
import { RateLimiter } from '../../lib/rateLimiter.js';

describe('RateLimiter', () => {
  it('should allow requests within rate limit', async () => {
    const limiter = new RateLimiter({ maxPerSecond: 5 });
    const start = Date.now();

    // 5 requests should complete quickly
    for (let i = 0; i < 5; i++) {
      await limiter.acquire();
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('should throttle requests exceeding rate limit', async () => {
    const limiter = new RateLimiter({ maxPerSecond: 5 });
    const start = Date.now();

    // 6th request should wait ~200ms (1/5 second)
    for (let i = 0; i < 6; i++) {
      await limiter.acquire();
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(150);
  });

  it('should execute function through the limiter', async () => {
    const limiter = new RateLimiter({ maxPerSecond: 5 });
    const fn = jest.fn().mockResolvedValue('result');

    const result = await limiter.execute(fn);
    expect(result).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/lib/rateLimiter"`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the rate limiter**

```javascript
// lib/rateLimiter.js

/**
 * Token-bucket rate limiter for Nexon API calls.
 * All API calls (character sync, guild sync, cron) must go through this.
 */
export class RateLimiter {
  constructor({ maxPerSecond = 5 } = {}) {
    this.maxTokens = maxPerSecond;
    this.tokens = maxPerSecond;
    this.interval = 1000 / maxPerSecond; // ms between refills
    this.lastRefill = Date.now();
  }

  async acquire() {
    while (this.tokens < 1) {
      const now = Date.now();
      const elapsed = now - this.lastRefill;
      const newTokens = elapsed / this.interval;

      if (newTokens >= 1) {
        this.tokens = Math.min(
          this.maxTokens,
          this.tokens + Math.floor(newTokens)
        );
        this.lastRefill = now;
      }

      if (this.tokens < 1) {
        const waitTime = this.interval - (Date.now() - this.lastRefill);
        await new Promise(resolve =>
          setTimeout(resolve, Math.max(waitTime, 10))
        );
      }
    }

    this.tokens -= 1;
  }

  async execute(fn) {
    await this.acquire();
    return fn();
  }
}

// Shared singleton — all Nexon API calls use this
let globalLimiter;

export function getGlobalRateLimiter() {
  if (!globalLimiter) {
    globalLimiter = new RateLimiter({ maxPerSecond: 5 });
  }
  return globalLimiter;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/lib/rateLimiter"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/rateLimiter.js __tests__/lib/rateLimiter.test.js
git commit -m "feat: add token-bucket rate limiter for Nexon API"
```

---

## Task 3: Guild DB Schema + Migration

**Files:**

- Create: `lib/db/guildSchema.js`
- Modify: `lib/db/schema.js`

- [ ] **Step 1: Create guild schema**

```javascript
// lib/db/guildSchema.js
import {
  mysqlTable,
  varchar,
  int,
  text,
  timestamp,
  index,
  uniqueIndex,
  bigint,
} from 'drizzle-orm/mysql-core';
import { characters } from './schema.js';

export const guilds = mysqlTable(
  'guilds',
  {
    oguildId: varchar('oguild_id', { length: 64 }).primaryKey(),
    guildName: varchar('guild_name', { length: 100 }).notNull(),
    worldName: varchar('world_name', { length: 20 }).notNull(),
    guildLevel: int('guild_level'),
    guildFame: int('guild_fame'),
    guildPoint: int('guild_point'),
    guildMasterName: varchar('guild_master_name', { length: 50 }),
    guildMemberCount: int('guild_member_count'),
    guildMark: text('guild_mark'),
    guildMarkCustom: text('guild_mark_custom'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [index('idx_guild_name_world').on(table.guildName, table.worldName)]
);

export const guildSkills = mysqlTable(
  'guild_skills',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    oguildId: varchar('oguild_id', { length: 64 })
      .notNull()
      .references(() => guilds.oguildId, { onDelete: 'cascade' }),
    skillType: varchar('skill_type', { length: 10 }).notNull(),
    skillName: varchar('skill_name', { length: 100 }).notNull(),
    skillDescription: text('skill_description'),
    skillLevel: int('skill_level'),
    skillEffect: text('skill_effect'),
    skillIcon: text('skill_icon'),
  },
  table => [
    uniqueIndex('idx_guild_skill_unique').on(
      table.oguildId,
      table.skillType,
      table.skillName
    ),
  ]
);

export const guildMembers = mysqlTable(
  'guild_members',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().autoincrement(),
    oguildId: varchar('oguild_id', { length: 64 })
      .notNull()
      .references(() => guilds.oguildId, { onDelete: 'cascade' }),
    characterName: varchar('character_name', { length: 50 }).notNull(),
    ocid: varchar('ocid', { length: 64 }).references(() => characters.ocid, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  },
  table => [
    index('idx_guild_member_oguild').on(table.oguildId),
    index('idx_guild_member_ocid').on(table.ocid),
  ]
);
```

- [ ] **Step 2: Import guild schema in migration config**

Do **not** re-export from `schema.js` (avoids circular imports since `guildSchema.js` imports `characters` from `schema.js`). Instead, import `guildSchema.js` directly wherever guild tables are needed (queries, migrations).

If the Drizzle config needs all schemas, update `drizzle.config.js` to include both files:

```javascript
schema: ['./lib/db/schema.js', './lib/db/guildSchema.js'],
```

- [ ] **Step 3: Generate and run migration**

Run: `npx drizzle-kit generate` then `npx drizzle-kit migrate` (or the project's migration command).

If using manual migrations, create the SQL:

```sql
CREATE TABLE `guilds` (
  `oguild_id` varchar(64) PRIMARY KEY,
  `guild_name` varchar(100) NOT NULL,
  `world_name` varchar(20) NOT NULL,
  `guild_level` int,
  `guild_fame` int,
  `guild_point` int,
  `guild_master_name` varchar(50),
  `guild_member_count` int,
  `guild_mark` text,
  `guild_mark_custom` text,
  `created_at` timestamp DEFAULT NOW(),
  `updated_at` timestamp DEFAULT NOW() ON UPDATE NOW(),
  INDEX `idx_guild_name_world` (`guild_name`, `world_name`)
);

CREATE TABLE `guild_skills` (
  `id` bigint AUTO_INCREMENT PRIMARY KEY,
  `oguild_id` varchar(64) NOT NULL,
  `skill_type` varchar(10) NOT NULL,
  `skill_name` varchar(100) NOT NULL,
  `skill_description` text,
  `skill_level` int,
  `skill_effect` text,
  `skill_icon` text,
  UNIQUE INDEX `idx_guild_skill_unique` (`oguild_id`, `skill_type`, `skill_name`),
  FOREIGN KEY (`oguild_id`) REFERENCES `guilds`(`oguild_id`) ON DELETE CASCADE
);

CREATE TABLE `guild_members` (
  `id` bigint AUTO_INCREMENT PRIMARY KEY,
  `oguild_id` varchar(64) NOT NULL,
  `character_name` varchar(50) NOT NULL,
  `ocid` varchar(64),
  `created_at` timestamp DEFAULT NOW(),
  `updated_at` timestamp DEFAULT NOW() ON UPDATE NOW(),
  INDEX `idx_guild_member_oguild` (`oguild_id`),
  INDEX `idx_guild_member_ocid` (`ocid`),
  FOREIGN KEY (`oguild_id`) REFERENCES `guilds`(`oguild_id`) ON DELETE CASCADE,
  FOREIGN KEY (`ocid`) REFERENCES `characters`(`ocid`) ON DELETE SET NULL
);
```

- [ ] **Step 4: Verify migration runs cleanly**

Run the migration against your local/dev MySQL and confirm tables exist.

- [ ] **Step 5: Commit**

```bash
git add lib/db/guildSchema.js lib/db/schema.js drizzle/
git commit -m "feat: add guild DB schema and migration"
```

---

## Task 4: Guild API Functions in nexonApi.js

**Files:**

- Modify: `lib/nexonApi.js`
- Test: `__tests__/lib/nexonApi.test.js` (extend existing)

Guild endpoints use the same TWMS base URL (`NEXT_PUBLIC_API_BASE_URL`) and the same `apiClient` as character endpoints. No separate file needed.

- [ ] **Step 1: Add guild API test cases**

Add to `__tests__/lib/nexonApi.test.js`:

```javascript
describe('getGuildId', () => {
  it('should return oguild_id for guild name + world', async () => {
    // mock apiClient.get to return { data: { oguild_id: 'guild123' } }
    const result = await getGuildId('TestGuild', '艾麗亞');
    expect(result).toBe('guild123');
  });
});

describe('getGuildBasic', () => {
  it('should return guild basic info', async () => {
    // mock apiClient.get to return guild data
    const result = await getGuildBasic('guild123');
    expect(result.guild_name).toBe('TestGuild');
    expect(result.guild_member).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/lib/nexonApi"`
Expected: FAIL — `getGuildId` is not exported

- [ ] **Step 3: Add guild functions to nexonApi.js**

Add to `lib/nexonApi.js` (uses existing `apiClient`):

```javascript
export const getGuildId = async (guildName, worldName) => {
  try {
    const response = await apiClient.get(
      `/guild/id?guild_name=${encodeURIComponent(guildName)}&world_name=${encodeURIComponent(worldName)}`
    );
    return response.data.oguild_id;
  } catch (error) {
    throw new Error(
      `Failed to fetch guild ID for "${guildName}" in "${worldName}": ${error.message}`
    );
  }
};

export const getGuildBasic = async (oguildId, date) => {
  try {
    let url = `/guild/basic?oguild_id=${oguildId}`;
    if (date) url += `&date=${date}`;
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch guild basic info: ${error.message}`);
  }
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/lib/nexonApi"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/nexonApi.js __tests__/lib/nexonApi.test.js
git commit -m "feat: add guild API functions to nexonApi.js"
```

---

## Task 5: Guild DB Queries

**Files:**

- Create: `lib/db/guildQueries.js`
- Test: `__tests__/lib/db/guildQueries.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
// __tests__/lib/db/guildQueries.test.js
import {
  upsertGuild,
  syncGuildMembers,
  getGuildByOguildId,
  getGuildWithMembers,
  upsertGuildSkills,
} from '../../../lib/db/guildQueries.js';

// Mock getDb
jest.mock('../../../lib/db/index.js', () => ({
  getDb: jest.fn(),
}));

describe('guildQueries', () => {
  it('should export upsertGuild', () => {
    expect(typeof upsertGuild).toBe('function');
  });

  it('should export syncGuildMembers', () => {
    expect(typeof syncGuildMembers).toBe('function');
  });

  it('should export getGuildByOguildId', () => {
    expect(typeof getGuildByOguildId).toBe('function');
  });

  it('should export getGuildWithMembers', () => {
    expect(typeof getGuildWithMembers).toBe('function');
  });

  it('should export upsertGuildSkills', () => {
    expect(typeof upsertGuildSkills).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/lib/db/guildQueries"`
Expected: FAIL — module not found

- [ ] **Step 3: Implement guild queries**

```javascript
// lib/db/guildQueries.js
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { getDb } from './index.js';
import { guilds, guildSkills, guildMembers } from './guildSchema.js';
import { characters } from './schema.js';

export async function upsertGuild(data) {
  const db = getDb();
  await db
    .insert(guilds)
    .values({
      oguildId: data.oguildId,
      guildName: data.guildName,
      worldName: data.worldName,
      guildLevel: data.guildLevel,
      guildFame: data.guildFame,
      guildPoint: data.guildPoint,
      guildMasterName: data.guildMasterName,
      guildMemberCount: data.guildMemberCount,
      guildMark: data.guildMark,
      guildMarkCustom: data.guildMarkCustom,
    })
    .onDuplicateKeyUpdate({
      set: {
        guildName: data.guildName,
        guildLevel: data.guildLevel,
        guildFame: data.guildFame,
        guildPoint: data.guildPoint,
        guildMasterName: data.guildMasterName,
        guildMemberCount: data.guildMemberCount,
        guildMark: data.guildMark,
        guildMarkCustom: data.guildMarkCustom,
        updatedAt: sql`NOW()`,
      },
    });
}

export async function upsertGuildSkills(oguildId, skills, skillType) {
  const db = getDb();
  // Delete existing skills of this type, then insert fresh
  await db
    .delete(guildSkills)
    .where(
      and(
        eq(guildSkills.oguildId, oguildId),
        eq(guildSkills.skillType, skillType)
      )
    );

  if (skills && skills.length > 0) {
    await db.insert(guildSkills).values(
      skills.map(s => ({
        oguildId,
        skillType,
        skillName: s.skill_name,
        skillDescription: s.skill_description,
        skillLevel: s.skill_level,
        skillEffect: s.skill_effect,
        skillIcon: s.skill_icon,
      }))
    );
  }
}

export async function syncGuildMembers(oguildId, memberNames) {
  const db = getDb();

  // Get current members in DB
  const existing = await db
    .select({ id: guildMembers.id, characterName: guildMembers.characterName })
    .from(guildMembers)
    .where(eq(guildMembers.oguildId, oguildId));

  const existingNames = new Set(existing.map(m => m.characterName));
  const newNames = new Set(memberNames);

  // Remove members who left
  const toRemove = existing.filter(m => !newNames.has(m.characterName));
  if (toRemove.length > 0) {
    await db.delete(guildMembers).where(
      inArray(
        guildMembers.id,
        toRemove.map(m => m.id)
      )
    );
  }

  // Add new members
  const toAdd = memberNames.filter(name => !existingNames.has(name));
  if (toAdd.length > 0) {
    await db.insert(guildMembers).values(
      toAdd.map(name => ({
        oguildId,
        characterName: name,
      }))
    );
  }

  return { added: toAdd.length, removed: toRemove.length };
}

export async function getGuildByOguildId(oguildId) {
  const db = getDb();
  const [guild] = await db
    .select()
    .from(guilds)
    .where(eq(guilds.oguildId, oguildId))
    .limit(1);
  return guild || null;
}

export async function getGuildWithMembers(oguildId) {
  const db = getDb();

  const guild = await getGuildByOguildId(oguildId);
  if (!guild) return null;

  // Get members with character data
  const members = await db
    .select({
      id: guildMembers.id,
      characterName: guildMembers.characterName,
      ocid: guildMembers.ocid,
      // Character data (null if not synced)
      characterLevel: characters.characterLevel,
      characterClass: characters.characterClass,
      combatPower: characters.combatPower,
      characterImage: characters.characterImage,
      characterExpRate: characters.characterExpRate,
    })
    .from(guildMembers)
    .leftJoin(characters, eq(guildMembers.ocid, characters.ocid))
    .where(eq(guildMembers.oguildId, oguildId));

  // Get skills
  const skills = await db
    .select()
    .from(guildSkills)
    .where(eq(guildSkills.oguildId, oguildId));

  return {
    ...guild,
    members,
    skills: {
      regular: skills.filter(s => s.skillType === 'regular'),
      noblesse: skills.filter(s => s.skillType === 'noblesse'),
    },
  };
}

export async function updateGuildMemberOcid(oguildId, characterName, ocid) {
  const db = getDb();
  await db
    .update(guildMembers)
    .set({ ocid, updatedAt: sql`NOW()` })
    .where(
      and(
        eq(guildMembers.oguildId, oguildId),
        eq(guildMembers.characterName, characterName)
      )
    );
}

export async function getGuildsByRecentActivity(days = 7) {
  const db = getDb();
  return db
    .select()
    .from(guilds)
    .where(sql`${guilds.updatedAt} > DATE_SUB(NOW(), INTERVAL ${days} DAY)`);
}

/**
 * Lightweight character upsert for guild sync.
 * Does NOT overwrite combatPower or other fields from the full sync.
 * Uses INSERT ... ON DUPLICATE KEY UPDATE with only basic fields.
 */
export async function upsertCharacterBasicOnly(data) {
  const db = getDb();
  await db
    .insert(characters)
    .values({
      ocid: data.ocid,
      characterName: data.characterName,
      characterLevel: data.characterLevel,
      characterClass: data.characterClass,
      characterClassLevel: data.characterClassLevel,
      characterGuildName: data.characterGuildName,
      characterImage: data.characterImage,
      characterExpRate: data.characterExpRate,
      characterGender: data.characterGender,
      worldName: data.worldName,
      status: 'success',
    })
    .onDuplicateKeyUpdate({
      set: {
        characterName: data.characterName,
        characterLevel: data.characterLevel,
        characterClass: data.characterClass,
        characterClassLevel: data.characterClassLevel,
        characterGuildName: data.characterGuildName,
        characterImage: data.characterImage,
        characterExpRate: data.characterExpRate,
        characterGender: data.characterGender,
        worldName: data.worldName,
        // NOTE: combatPower intentionally excluded — preserved from full sync
        updatedAt: sql`NOW()`,
      },
    });
}

export async function getUnsyncedGuildMembers(oguildId) {
  const db = getDb();
  return db
    .select()
    .from(guildMembers)
    .where(
      and(
        eq(guildMembers.oguildId, oguildId),
        sql`${guildMembers.ocid} IS NULL`
      )
    );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/lib/db/guildQueries"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/db/guildQueries.js __tests__/lib/db/guildQueries.test.js
git commit -m "feat: add guild DB query functions"
```

---

## Task 6: Guild Sync Service

**Files:**

- Create: `lib/guildSyncService.js`
- Test: `__tests__/lib/guildSyncService.test.js`

- [ ] **Step 1: Write the failing tests**

```javascript
// __tests__/lib/guildSyncService.test.js
import {
  syncGuildMemberBasic,
  startGuildSync,
} from '../../lib/guildSyncService.js';

jest.mock('../../lib/nexonApi.js');
jest.mock('../../lib/guildApi.js');
jest.mock('../../lib/db/guildQueries.js');
jest.mock('../../lib/db/queries.js');
jest.mock('../../lib/redis.js');
jest.mock('../../lib/rateLimiter.js', () => ({
  getGlobalRateLimiter: () => ({
    execute: jest.fn(fn => fn()),
  }),
}));

describe('guildSyncService', () => {
  it('should export syncGuildMemberBasic', () => {
    expect(typeof syncGuildMemberBasic).toBe('function');
  });

  it('should export startGuildSync', () => {
    expect(typeof startGuildSync).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/lib/guildSyncService"`
Expected: FAIL — module not found

- [ ] **Step 3: Implement guild sync service**

```javascript
// lib/guildSyncService.js
import {
  getCharacterOcid,
  getCharacterBasicInfo,
  getGuildId,
  getGuildBasic,
} from './nexonApi.js';
import {
  upsertGuild,
  upsertGuildSkills,
  syncGuildMembers,
  updateGuildMemberOcid,
  getUnsyncedGuildMembers,
  upsertCharacterBasicOnly,
} from './db/guildQueries.js';
import { getRedis } from './redis.js';
import { getGlobalRateLimiter } from './rateLimiter.js';

const SYNC_STATUS_TTL = 600; // 10 minutes
// Use KEY_PREFIX consistent with lib/redis.js
const KEY_PREFIX = 'maple:';

function syncStatusKey(oguildId) {
  return `${KEY_PREFIX}guild:sync:status:${oguildId}`;
}

export async function getSyncStatus(oguildId) {
  const redis = getRedis();
  const status = await redis.hgetall(syncStatusKey(oguildId));
  if (!status || !status.total) return null;
  return {
    total: parseInt(status.total, 10),
    synced: parseInt(status.synced || '0', 10),
    failed: parseInt(status.failed || '0', 10),
    inProgress: status.inProgress === 'true',
    startedAt: status.startedAt,
  };
}

async function setSyncStatus(oguildId, data) {
  const redis = getRedis();
  const key = syncStatusKey(oguildId);
  await redis.hmset(key, {
    total: String(data.total),
    synced: String(data.synced),
    failed: String(data.failed),
    inProgress: String(data.inProgress),
    startedAt: data.startedAt || new Date().toISOString(),
  });
  await redis.expire(key, SYNC_STATUS_TTL);
}

export async function syncGuildMemberBasic(oguildId, characterName) {
  const limiter = getGlobalRateLimiter();

  try {
    const ocid = await limiter.execute(() => getCharacterOcid(characterName));

    const basicInfo = await limiter.execute(() => getCharacterBasicInfo(ocid));

    // Use guild-specific lightweight upsert that does NOT overwrite
    // combatPower or other fields from the full sync (stats API).
    // Only updates basic info fields. If character already has full
    // data from a prior search, those fields are preserved.
    await upsertCharacterBasicOnly({
      ocid,
      characterName: basicInfo.character_name,
      characterLevel: basicInfo.character_level,
      characterClass: basicInfo.character_class,
      characterClassLevel: basicInfo.character_class_level,
      characterGuildName: basicInfo.character_guild_name,
      characterImage: basicInfo.character_image,
      characterExpRate: basicInfo.character_exp_rate,
      characterGender: basicInfo.character_gender,
      worldName: basicInfo.world_name,
    });

    await updateGuildMemberOcid(oguildId, characterName, ocid);
    return { success: true, characterName, ocid };
  } catch (error) {
    console.error(
      `Guild member sync failed for "${characterName}":`,
      error.message
    );
    return { success: false, characterName, error: error.message };
  }
}

export async function searchAndSyncGuild(guildName, worldName) {
  const limiter = getGlobalRateLimiter();

  // Step 1: Get guild ID
  const oguildId = await limiter.execute(() =>
    getGuildId(guildName, worldName)
  );

  // Step 2: Get guild basic info
  const guildInfo = await limiter.execute(() => getGuildBasic(oguildId));

  // Step 3: Upsert guild data
  await upsertGuild({
    oguildId,
    guildName: guildInfo.guild_name,
    worldName: guildInfo.world_name,
    guildLevel: guildInfo.guild_level,
    guildFame: guildInfo.guild_fame,
    guildPoint: guildInfo.guild_point,
    guildMasterName: guildInfo.guild_master_name,
    guildMemberCount: guildInfo.guild_member_count,
    guildMark: guildInfo.guild_mark,
    guildMarkCustom: guildInfo.guild_mark_custom,
  });

  // Step 4: Sync skills
  await upsertGuildSkills(oguildId, guildInfo.guild_skill, 'regular');
  await upsertGuildSkills(oguildId, guildInfo.guild_noblesse_skill, 'noblesse');

  // Step 5: Sync member list (add/remove)
  const memberNames = guildInfo.guild_member || [];
  await syncGuildMembers(oguildId, memberNames);

  return { oguildId, guildInfo, memberCount: memberNames.length };
}

export async function startGuildSync(oguildId) {
  // Check for existing sync
  const existing = await getSyncStatus(oguildId);
  if (existing && existing.inProgress) {
    return existing;
  }

  const unsynced = await getUnsyncedGuildMembers(oguildId);
  if (unsynced.length === 0) {
    return { total: 0, synced: 0, failed: 0, inProgress: false };
  }

  const status = {
    total: unsynced.length,
    synced: 0,
    failed: 0,
    inProgress: true,
    startedAt: new Date().toISOString(),
  };
  await setSyncStatus(oguildId, status);

  // Run sync in background (fire and forget)
  syncMembersInBackground(oguildId, unsynced).catch(err =>
    console.error(`Guild sync background error for ${oguildId}:`, err)
  );

  return status;
}

async function syncMembersInBackground(oguildId, members) {
  let synced = 0;
  let failed = 0;

  for (const member of members) {
    const result = await syncGuildMemberBasic(oguildId, member.characterName);

    if (result.success) {
      synced++;
    } else {
      failed++;
    }

    await setSyncStatus(oguildId, {
      total: members.length,
      synced,
      failed,
      inProgress: true,
    });
  }

  // Mark complete
  await setSyncStatus(oguildId, {
    total: members.length,
    synced,
    failed,
    inProgress: false,
  });

  console.log(
    `Guild sync complete for ${oguildId}: ${synced} synced, ${failed} failed`
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --testPathPattern="__tests__/lib/guildSyncService"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/guildSyncService.js __tests__/lib/guildSyncService.test.js
git commit -m "feat: add guild background sync service"
```

---

## Task 7: Guild API Routes

**Files:**

- Create: `app/api/guild/search/route.js`
- Create: `app/api/guild/[oguildId]/route.js`
- Create: `app/api/guild/[oguildId]/sync-status/route.js`
- Test: `__tests__/api/guild/search.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
// __tests__/api/guild/search.test.js
import { GET } from '../../../app/api/guild/search/route.js';

jest.mock('../../../lib/guildSyncService.js');
jest.mock('../../../lib/redis.js');

describe('GET /api/guild/search', () => {
  it('should return 400 if name is missing', async () => {
    const request = new Request(
      'http://localhost/api/guild/search?world=艾麗亞'
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('should return 400 if world is missing', async () => {
    const request = new Request(
      'http://localhost/api/guild/search?name=TestGuild'
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --testPathPattern="__tests__/api/guild/search"`
Expected: FAIL — module not found

- [ ] **Step 3: Implement guild search route**

```javascript
// app/api/guild/search/route.js
import { NextResponse } from 'next/server';
import {
  searchAndSyncGuild,
  startGuildSync,
} from '../../../../lib/guildSyncService.js';
import { getCached, setCache } from '../../../../lib/redis.js';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const world = searchParams.get('world');

  if (!name || !world) {
    return NextResponse.json(
      { error: 'name and world are required' },
      { status: 400 }
    );
  }

  try {
    const cacheKey = `guild:search:${world}:${name}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const { oguildId, guildInfo, memberCount } = await searchAndSyncGuild(
      name,
      world
    );

    // Start background member sync
    const syncStatus = await startGuildSync(oguildId);

    const result = {
      oguildId,
      guildName: guildInfo.guild_name,
      worldName: guildInfo.world_name,
      guildLevel: guildInfo.guild_level,
      guildFame: guildInfo.guild_fame,
      guildPoint: guildInfo.guild_point,
      guildMasterName: guildInfo.guild_master_name,
      memberCount,
      syncStatus,
    };

    setCache(cacheKey, result, 600).catch(() => {});

    return NextResponse.json(result);
  } catch (error) {
    console.error('Guild search error:', error);

    if (error.message.includes('404') || error.message.includes('not found')) {
      return NextResponse.json({ error: '找不到此工會' }, { status: 404 });
    }

    return NextResponse.json({ error: '搜尋工會時發生錯誤' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Implement guild detail route**

```javascript
// app/api/guild/[oguildId]/route.js
import { NextResponse } from 'next/server';
import { getGuildWithMembers } from '../../../../lib/db/guildQueries.js';
import { getSyncStatus } from '../../../../lib/guildSyncService.js';

export async function GET(request, { params }) {
  const { oguildId } = await params;

  try {
    const guild = await getGuildWithMembers(oguildId);
    if (!guild) {
      return NextResponse.json({ error: '工會不存在' }, { status: 404 });
    }

    const syncStatus = await getSyncStatus(oguildId);

    return NextResponse.json({
      ...guild,
      syncStatus: syncStatus || {
        total: 0,
        synced: 0,
        failed: 0,
        inProgress: false,
      },
    });
  } catch (error) {
    console.error('Guild detail error:', error);
    return NextResponse.json(
      { error: '取得工會資料時發生錯誤' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Implement sync status route**

```javascript
// app/api/guild/[oguildId]/sync-status/route.js
import { NextResponse } from 'next/server';
import { getSyncStatus } from '../../../../../lib/guildSyncService.js';

export async function GET(request, { params }) {
  const { oguildId } = await params;

  try {
    const status = await getSyncStatus(oguildId);
    return NextResponse.json(
      status || { total: 0, synced: 0, failed: 0, inProgress: false }
    );
  } catch (error) {
    console.error('Sync status error:', error);
    return NextResponse.json(
      { error: '取得同步狀態時發生錯誤' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: Run tests**

Run: `npm test -- --testPathPattern="__tests__/api/guild"`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/api/guild/
git add __tests__/api/guild/
git commit -m "feat: add guild API routes (search, detail, sync-status)"
```

---

## Task 8: Cron Integration

**Files:**

- Modify: `lib/cron.js`

- [ ] **Step 1: Add guild refresh cron job**

Add to `lib/cron.js` inside `initCronJobs()`:

```javascript
// Refresh recently viewed guilds every 6 hours
cron.schedule('30 */6 * * *', async () => {
  try {
    const { getGuildsByRecentActivity } = await import('./db/guildQueries.js');
    const { searchAndSyncGuild, startGuildSync } =
      await import('./guildSyncService.js');

    const guilds = await getGuildsByRecentActivity(7);
    console.log(`[Cron] Refreshing ${guilds.length} active guilds`);

    for (const guild of guilds) {
      try {
        await searchAndSyncGuild(guild.guildName, guild.worldName);
        await startGuildSync(guild.oguildId);
        console.log(`[Cron] Refreshed guild: ${guild.guildName}`);
      } catch (error) {
        console.error(
          `[Cron] Failed to refresh guild ${guild.guildName}:`,
          error.message
        );
      }
    }
  } catch (error) {
    console.error('[Cron] Guild refresh error:', error);
  }
});
```

Note: Uses `'30 */6 * * *'` (offset by 30 min from character refresh) to avoid concurrent load.

- [ ] **Step 2: Verify existing tests still pass**

Run: `npm test`
Expected: All PASS

- [ ] **Step 3: Commit**

```bash
git add lib/cron.js
git commit -m "feat: add guild refresh cron job (every 6 hours)"
```

---

## Task 9: Guild Search Page

**Files:**

- Create: `app/guild/page.js`
- Create: `components/GuildSearch.js`

- [ ] **Step 1: Create guild search component**

```javascript
// components/GuildSearch.js
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const WORLDS = [
  '殺人鯨',
  '琉德',
  '普力特',
  '優伊娜',
  '艾麗亞',
  '引那斯',
  '瑞普',
  '克洛亞',
  '文森',
];

export default function GuildSearch() {
  const router = useRouter();
  const [guildName, setGuildName] = useState('');
  const [world, setWorld] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = useCallback(
    async e => {
      e.preventDefault();
      if (!guildName.trim() || !world) return;

      setLoading(true);
      setError('');

      try {
        const res = await fetch(
          `/api/guild/search?name=${encodeURIComponent(guildName.trim())}&world=${encodeURIComponent(world)}`
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '搜尋失敗');
        }

        router.push(
          `/guild/${encodeURIComponent(world)}/${encodeURIComponent(guildName.trim())}`
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [guildName, world, router]
  );

  return (
    <Box
      component="form"
      onSubmit={handleSearch}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        alignItems: 'stretch',
      }}
    >
      <FormControl sx={{ minWidth: 140 }}>
        <InputLabel>伺服器</InputLabel>
        <Select
          value={world}
          label="伺服器"
          onChange={e => setWorld(e.target.value)}
        >
          {WORLDS.map(w => (
            <MenuItem key={w} value={w}>
              {w}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="工會名稱"
        value={guildName}
        onChange={e => setGuildName(e.target.value)}
        sx={{ flex: 1 }}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={loading || !guildName.trim() || !world}
        startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
        sx={{ minWidth: 100 }}
      >
        {loading ? '搜尋中' : '搜尋'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Create guild search page**

```javascript
// app/guild/page.js
import { Container, Typography, Box } from '@mui/material';
import GuildSearch from '../../components/GuildSearch';

export const metadata = {
  title: '工會搜尋 | Maple Hub',
  description: '搜尋 MapleStory 工會，查看成員排行、職業分布、等級分析',
};

export default function GuildPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
        工會搜尋
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        輸入工會名稱與伺服器，查看工會成員與數據分析
      </Typography>

      <Box
        sx={{
          p: 3,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      >
        <GuildSearch />
      </Box>
    </Container>
  );
}
```

- [ ] **Step 3: Verify page renders locally**

Run: `npm run dev`, navigate to `/guild`
Expected: Search form with server dropdown and guild name input renders correctly

- [ ] **Step 4: Commit**

```bash
git add app/guild/page.js components/GuildSearch.js
git commit -m "feat: add guild search page and component"
```

---

## Task 10: Guild Detail Page + Components

**Files:**

- Create: `app/guild/[server]/[guildName]/page.js`
- Create: `components/GuildInfoCard.js`
- Create: `components/GuildMemberTable.js`
- Create: `components/GuildSyncProgress.js`
- Create: `components/GuildDistributions.js`
- Create: `components/GuildMyPosition.js`
- Create: `components/GuildHighlights.js`

This is the largest task. Build component by component.

- [ ] **Step 1: Create sync progress component**

```javascript
// components/GuildSyncProgress.js
'use client';

import { Box, LinearProgress, Typography } from '@mui/material';

export default function GuildSyncProgress({ syncStatus }) {
  if (!syncStatus || !syncStatus.inProgress) return null;

  const progress =
    syncStatus.total > 0
      ? ((syncStatus.synced + syncStatus.failed) / syncStatus.total) * 100
      : 0;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          同步成員資料中...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {syncStatus.synced + syncStatus.failed}/{syncStatus.total}
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
}
```

- [ ] **Step 2: Create guild info card**

```javascript
// components/GuildInfoCard.js
'use client';

import { Box, Typography, Chip, Avatar } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import StarIcon from '@mui/icons-material/Star';

export default function GuildInfoCard({ guild }) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        {guild.guildMarkCustom && (
          <Avatar
            src={`data:image/png;base64,${guild.guildMarkCustom}`}
            variant="rounded"
            sx={{ width: 48, height: 48 }}
          />
        )}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {guild.guildName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {guild.worldName}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip
          icon={<StarIcon />}
          label={`Lv.${guild.guildLevel}`}
          sx={{ px: 1 }}
        />
        <Chip
          icon={<GroupsIcon />}
          label={`${guild.guildMemberCount} 人`}
          sx={{ px: 1 }}
        />
        <Chip label={`名聲 ${guild.guildFame}`} sx={{ px: 1 }} />
        <Chip label={`會長: ${guild.guildMasterName}`} sx={{ px: 1 }} />
      </Box>
    </Box>
  );
}
```

- [ ] **Step 3: Create member table**

```javascript
// components/GuildMemberTable.js
'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  Avatar,
  Chip,
} from '@mui/material';
import Link from 'next/link';

export default function GuildMemberTable({ members, myCharacterName }) {
  const [orderBy, setOrderBy] = useState('combatPower');
  const [order, setOrder] = useState('desc');
  const [search, setSearch] = useState('');

  const sortedMembers = useMemo(() => {
    const filtered = members.filter(m =>
      m.characterName.toLowerCase().includes(search.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const aVal = a[orderBy] ?? 0;
      const bVal = b[orderBy] ?? 0;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [members, orderBy, order, search]);

  const handleSort = field => {
    if (orderBy === field) {
      setOrder(order === 'desc' ? 'asc' : 'desc');
    } else {
      setOrderBy(field);
      setOrder('desc');
    }
  };

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        mb: 3,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        成員排行
      </Typography>

      <TextField
        size="small"
        placeholder="搜尋成員..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2, width: '100%', maxWidth: 300 }}
      />

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>職業</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'characterLevel'}
                  direction={orderBy === 'characterLevel' ? order : 'desc'}
                  onClick={() => handleSort('characterLevel')}
                >
                  等級
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'combatPower'}
                  direction={orderBy === 'combatPower' ? order : 'desc'}
                  onClick={() => handleSort('combatPower')}
                >
                  戰力
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedMembers.map((member, idx) => {
              const isMe = member.characterName === myCharacterName;
              return (
                <TableRow
                  key={member.id || member.characterName}
                  sx={{
                    bgcolor: isMe ? 'rgba(247, 147, 30, 0.1)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {member.characterImage && (
                        <Avatar
                          src={member.characterImage}
                          sx={{ width: 32, height: 32 }}
                        />
                      )}
                      <Link
                        href={`/character/${encodeURIComponent(member.characterName)}`}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                      >
                        {member.characterName}
                        {isMe && (
                          <Chip
                            label="ME"
                            size="small"
                            color="warning"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Link>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {member.characterClass || (
                      <Typography variant="body2" color="text.disabled">
                        同步中...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{member.characterLevel ?? '—'}</TableCell>
                  <TableCell>
                    {member.combatPower
                      ? Number(member.combatPower).toLocaleString()
                      : '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
```

- [ ] **Step 4: Create distributions component**

```javascript
// components/GuildDistributions.js
'use client';

import { useMemo } from 'react';
import { Box, Typography, Grid2 } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';

const COLORS = [
  '#f7931e',
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dfe6e9',
  '#a29bfe',
  '#fd79a8',
  '#55a3e8',
];

export default function GuildDistributions({ members }) {
  const syncedMembers = members.filter(m => m.characterClass);

  const classData = useMemo(() => {
    const counts = {};
    syncedMembers.forEach(m => {
      counts[m.characterClass] = (counts[m.characterClass] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [syncedMembers]);

  const levelData = useMemo(() => {
    const buckets = {};
    syncedMembers.forEach(m => {
      if (!m.characterLevel) return;
      // Endgame-focused: <200 grouped, then 200-209, 210-219, ...
      let bucket;
      if (m.characterLevel < 200) {
        bucket = '<200';
      } else {
        const base = Math.floor(m.characterLevel / 10) * 10;
        bucket = `${base}-${base + 9}`;
      }
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    return Object.entries(buckets)
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        if (a.range === '<200') return -1;
        if (b.range === '<200') return 1;
        return parseInt(a.range) - parseInt(b.range);
      });
  }, [syncedMembers]);

  if (syncedMembers.length === 0) return null;

  return (
    <Grid2 container spacing={3} sx={{ mb: 3 }}>
      <Grid2 size={{ xs: 12, md: 6 }}>
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            height: '100%',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            職業分布
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={classData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {classData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Grid2>

      <Grid2 size={{ xs: 12, md: 6 }}>
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.3)',
            height: '100%',
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            等級分布
          </Typography>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={levelData}>
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#f7931e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Grid2>
    </Grid2>
  );
}
```

- [ ] **Step 5: Create "My Position" component**

```javascript
// components/GuildMyPosition.js
'use client';

import { useState, useMemo } from 'react';
import { Box, Typography, TextField, Autocomplete, Chip } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export default function GuildMyPosition({ members }) {
  const [myName, setMyName] = useState('');
  const syncedMembers = members.filter(m => m.characterLevel);

  const memberNames = useMemo(
    () => syncedMembers.map(m => m.characterName),
    [syncedMembers]
  );

  const position = useMemo(() => {
    if (!myName) return null;
    const me = syncedMembers.find(m => m.characterName === myName);
    if (!me) return null;

    const byLevel = [...syncedMembers].sort(
      (a, b) => (b.characterLevel || 0) - (a.characterLevel || 0)
    );
    const byCombat = [...syncedMembers].sort(
      (a, b) => (b.combatPower || 0) - (a.combatPower || 0)
    );

    const levelRank = byLevel.findIndex(m => m.characterName === myName) + 1;
    const combatRank = byCombat.findIndex(m => m.characterName === myName) + 1;
    const total = syncedMembers.length;

    return {
      levelRank,
      combatRank,
      total,
      levelPR: Math.round(((total - levelRank) / total) * 100),
      combatPR: Math.round(((total - combatRank) / total) * 100),
      ahead: combatRank - 1,
      behind: total - combatRank,
    };
  }, [myName, syncedMembers]);

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        mb: 3,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        我的位置
      </Typography>

      <Autocomplete
        options={memberNames}
        value={myName || null}
        onChange={(_, val) => setMyName(val || '')}
        renderInput={params => (
          <TextField {...params} label="選擇你的角色" size="small" />
        )}
        sx={{ mb: 2, maxWidth: 300 }}
      />

      {!myName && (
        <Typography variant="body2" color="text.secondary">
          選擇你的角色來查看你在工會中的位置
        </Typography>
      )}

      {myName && !position && (
        <Typography variant="body2" color="text.secondary">
          你的角色不在此工會中，或資料尚在同步中
        </Typography>
      )}

      {position && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1 }}>
          <Chip
            icon={<EmojiEventsIcon />}
            label={`戰力排名 第 ${position.combatRank}/${position.total} 名`}
            color="warning"
            sx={{ px: 1 }}
          />
          <Chip
            label={`等級排名 第 ${position.levelRank}/${position.total} 名`}
            sx={{ px: 1 }}
          />
          <Chip
            label={`戰力 PR ${position.combatPR}`}
            variant="outlined"
            sx={{ px: 1 }}
          />
          <Chip
            label={`前方 ${position.ahead} 人 · 後方 ${position.behind} 人`}
            variant="outlined"
            sx={{ px: 1 }}
          />
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 6: Create guild highlights component**

```javascript
// components/GuildHighlights.js
'use client';

import { useMemo } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export default function GuildHighlights({ members }) {
  const syncedMembers = members.filter(m => m.characterLevel);

  const highlights = useMemo(() => {
    if (syncedMembers.length === 0) return [];

    const results = [];

    // Highest level
    const byLevel = [...syncedMembers].sort(
      (a, b) => (b.characterLevel || 0) - (a.characterLevel || 0)
    );
    if (byLevel[0]) {
      results.push({
        label: `最高等級: ${byLevel[0].characterName} (Lv.${byLevel[0].characterLevel})`,
        color: 'warning',
      });
    }

    // Highest combat power
    const byCombat = [...syncedMembers].sort(
      (a, b) => (b.combatPower || 0) - (a.combatPower || 0)
    );
    if (byCombat[0]) {
      results.push({
        label: `最強戰力: ${byCombat[0].characterName} (${Number(byCombat[0].combatPower).toLocaleString()})`,
        color: 'error',
      });
    }

    // Most popular class
    const classCounts = {};
    syncedMembers.forEach(m => {
      if (m.characterClass) {
        classCounts[m.characterClass] =
          (classCounts[m.characterClass] || 0) + 1;
      }
    });
    const topClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0];
    if (topClass) {
      results.push({
        label: `最多人玩: ${topClass[0]} (${topClass[1]} 人)`,
        color: 'info',
      });
    }

    return results;
  }, [syncedMembers]);

  if (highlights.length === 0) return null;

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.3)',
        mb: 3,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        工會之最
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {highlights.map((h, i) => (
          <Chip
            key={i}
            icon={<EmojiEventsIcon />}
            label={h.label}
            color={h.color}
            sx={{ px: 1 }}
          />
        ))}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 7: Create guild detail page**

```javascript
// app/guild/[server]/[guildName]/page.js
import { Container } from '@mui/material';
import GuildDetailClient from './GuildDetailClient';

export async function generateMetadata({ params }) {
  const { server, guildName } = await params;
  const decodedGuild = decodeURIComponent(guildName);
  const decodedServer = decodeURIComponent(server);

  return {
    title: `${decodedGuild} - ${decodedServer} | Maple Hub`,
    description: `查看 ${decodedServer} 伺服器 ${decodedGuild} 工會的成員排行、職業分布與數據分析`,
  };
}

export default async function GuildDetailPage({ params }) {
  const { server, guildName } = await params;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <GuildDetailClient
        server={decodeURIComponent(server)}
        guildName={decodeURIComponent(guildName)}
      />
    </Container>
  );
}
```

- [ ] **Step 8: Create client-side guild detail wrapper**

Create `app/guild/[server]/[guildName]/GuildDetailClient.js` — this handles data fetching, polling, and renders all child components:

```javascript
// app/guild/[server]/[guildName]/GuildDetailClient.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Typography, CircularProgress, Alert, Box } from '@mui/material';
import GuildInfoCard from '../../../../components/GuildInfoCard';
import GuildMemberTable from '../../../../components/GuildMemberTable';
import GuildSyncProgress from '../../../../components/GuildSyncProgress';
import GuildDistributions from '../../../../components/GuildDistributions';
import GuildMyPosition from '../../../../components/GuildMyPosition';
import GuildHighlights from '../../../../components/GuildHighlights';

export default function GuildDetailClient({ server, guildName }) {
  const [guild, setGuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [oguildId, setOguildId] = useState(null);

  const fetchGuild = useCallback(async () => {
    try {
      // Step 1: Search to get oguildId (also triggers sync)
      const searchRes = await fetch(
        `/api/guild/search?name=${encodeURIComponent(guildName)}&world=${encodeURIComponent(server)}`
      );
      if (!searchRes.ok) {
        const data = await searchRes.json();
        throw new Error(data.error || '搜尋失敗');
      }
      const searchData = await searchRes.json();
      setOguildId(searchData.oguildId);

      // Step 2: Get full guild data
      const detailRes = await fetch(`/api/guild/${searchData.oguildId}`);
      if (!detailRes.ok) throw new Error('取得工會資料失敗');
      const detailData = await detailRes.json();
      setGuild(detailData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [guildName, server]);

  // Poll sync status
  useEffect(() => {
    if (!oguildId || !guild?.syncStatus?.inProgress) return;

    const interval = setInterval(async () => {
      try {
        // Refresh full guild data to get updated members
        const res = await fetch(`/api/guild/${oguildId}`);
        if (res.ok) {
          const data = await res.json();
          setGuild(data);

          if (!data.syncStatus?.inProgress) {
            clearInterval(interval);
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [oguildId, guild?.syncStatus?.inProgress]);

  useEffect(() => {
    fetchGuild();
  }, [fetchGuild]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!guild) return null;

  return (
    <>
      <GuildInfoCard guild={guild} />
      <GuildSyncProgress syncStatus={guild.syncStatus} />
      <GuildHighlights members={guild.members} />
      <GuildDistributions members={guild.members} />
      <GuildMyPosition members={guild.members} />
      <GuildMemberTable members={guild.members} />
    </>
  );
}
```

- [ ] **Step 9: Verify page renders with dev server**

Run: `npm run dev`, navigate to `/guild`, search a guild
Expected: Guild detail page loads with info card, member table (possibly with sync progress), distributions

- [ ] **Step 10: Commit**

```bash
git add app/guild/ components/Guild*.js
git commit -m "feat: add guild detail page with member table, distributions, and position panel"
```

---

## Task 11: Character Page Guild Link

**Files:**

- Modify: `app/character/[name]/page.js` (or the component that displays character info)

- [ ] **Step 1: Find where guild name is displayed**

Check the character detail page or its sub-components for `characterGuildName` or `guild` references.

- [ ] **Step 2: Add clickable guild link**

Where the guild name is displayed, wrap it in a Next.js `Link`:

```javascript
import Link from 'next/link';

// Replace plain guild name text with:
{
  character.characterGuildName && (
    <Link
      href={`/guild/${encodeURIComponent(character.worldName)}/${encodeURIComponent(character.characterGuildName)}`}
      style={{ color: 'inherit', textDecoration: 'underline' }}
    >
      {character.characterGuildName}
    </Link>
  );
}
```

- [ ] **Step 3: Verify link works**

Navigate to a character page → click guild name → should go to guild detail page

- [ ] **Step 4: Commit**

```bash
git add app/character/ components/
git commit -m "feat: add clickable guild link on character page"
```

---

## Task 12: Final Integration Test + Polish

- [ ] **Step 1: Run full test suite**

Run: `npm test`
Expected: All tests PASS

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: No lint errors

- [ ] **Step 4: Manual smoke test**

1. Navigate to `/guild` → search form renders
2. Search a guild → redirects to detail page
3. Guild info card shows correct data
4. Sync progress shows if members are loading
5. Member table populates progressively
6. Sort by level/combat power works
7. Distributions render after members sync
8. "My Position" works when selecting a character
9. Character page → guild name links to guild page
10. Dark/light mode renders correctly

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: polish guild feature integration"
```

---

## UI/UX Implementation Notes

**IMPORTANT:** The code samples in the tasks above are structural references. All frontend components MUST follow the existing design system described below. Do NOT copy the hardcoded light-mode styles from the task code verbatim.

### Dark Mode (P0 — applies to ALL components)

Every component must use the `useColorMode()` hook and apply mode-aware colors. The plan's code uses hardcoded `rgba(255,255,255,0.6)` which only works in light mode.

**Correct glassmorphism pattern** (from `app/about/page.js` `glassCardSx`):

```javascript
import { useColorMode } from '../components/MuiThemeProvider';

// Inside component:
const { mode } = useColorMode();

const glassCardSx = {
  borderRadius: 3,
  border: '1px solid',
  borderColor:
    mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(247,147,30,0.15)',
  bgcolor: mode === 'dark' ? 'rgba(42,31,26,0.6)' : 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(8px)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow:
      mode === 'dark'
        ? '0 8px 24px rgba(0,0,0,0.3)'
        : '0 8px 24px rgba(247,147,30,0.12)',
  },
};
```

Apply this pattern to: `GuildInfoCard`, `GuildMemberTable`, `GuildDistributions`, `GuildMyPosition`, `GuildHighlights`, `GuildSearch` (form container), and the search page card.

### Theme Colors

| Token          | Light                   | Dark                     | Usage                           |
| -------------- | ----------------------- | ------------------------ | ------------------------------- |
| Primary        | `#f7931e`               | `#f7931e`                | Buttons, active states, accents |
| Primary light  | `#ffb347`               | `#ffb347`                | Hover backgrounds               |
| Background     | `#fff7ec`               | `#1a1210`                | Page background                 |
| Paper          | `#fff3e0`               | `#2a1f1a`                | Card backgrounds                |
| Text primary   | `#4e342e`               | `#f5e6d3`                | Body text                       |
| Text secondary | `#6d4c41`               | `#c4a882`                | Captions, metadata              |
| Border (glass) | `rgba(247,147,30,0.15)` | `rgba(255,255,255,0.08)` | Card borders                    |

### Recharts Color Palette (P0)

The plan uses cool-tone colors (`#4ecdc4`, `#45b7d1`) that clash with the warm orange theme. Use this warm palette instead:

```javascript
const COLORS = [
  '#f7931e',
  '#cc6e00',
  '#ffb347',
  '#8c6239',
  '#b07d52',
  '#7cb342',
  '#e53935',
  '#ffa726',
  '#4fc3f7',
  '#ab47bc',
];
```

Also apply these Recharts conventions from `components/ProgressChart.js`:

- `CartesianGrid` stroke: `mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'`
- Tooltip: `bgcolor: theme.palette.background.paper`, `borderRadius: 8`, box-shadow
- XAxis/YAxis tick: `fill: theme.palette.text.secondary`, `fontSize: 11`
- Pie charts: use donut style with `innerRadius` (existing pattern)
- `ResponsiveContainer` height: 300-320px (250px is too small)

### Member Table vs Card List (P1)

The existing leaderboard uses card-style rows (`LeaderboardCard.js`), not MUI `Table`. The plan uses `Table` which is acceptable for 200 members (denser layout), but must incorporate these existing leaderboard visual elements:

- **Top 3 ranks:** Gold `#FFD700`, Silver `#C0C0C0`, Bronze `#CD7F32` (border-left accent)
- **Avatar size:** 48px (not 32px as in plan)
- **`prefers-reduced-motion`:** Wrap hover transforms in `@media (prefers-reduced-motion: reduce) { transform: none }`
- **Character link:** Use `color: 'primary.main'` on hover, not plain inherit

### Chip Styling (P1)

Per existing feedback (see CLAUDE.md): Chips must have sufficient padding. Always add:

```javascript
sx={{ px: 1.5 }}  // minimum, not px: 1
```

Use explicit `height` for alignment when mixing Chips with other elements. Reference: `components/CharacterCard.js` Chip patterns.

### Hover Effects (P1)

All interactive cards must have hover feedback. Use `translateY(-2px)` + box-shadow, **never `scale`** (causes layout shift). This is a project convention from CLAUDE.md.

### Component-Specific Notes

| Component            | Key Fix                                                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `GuildInfoCard`      | Add guild skills section (expandable). Add hover effect. Avatar should be default (round), not `variant="rounded"`.                             |
| `GuildMemberTable`   | Top-3 rank colors. Avatar 48px. Add empty state for 0 members. Distinguish "syncing" vs "failed" members (show different icon/text).            |
| `GuildDistributions` | Warm color palette. Donut chart (add `innerRadius`). Custom Tooltip matching theme. 300px+ height.                                              |
| `GuildMyPosition`    | Persist selected character to localStorage. Show character image when selected. Outlined Chips need explicit `borderColor` for dark mode.       |
| `GuildHighlights`    | Use different icons per highlight (not all `EmojiEventsIcon`). Consider card-style badges instead of just Chips for more visual impact.         |
| `GuildSearch`        | Add recent searches (localStorage, follow `lib/localStorage.js`). Move `Alert` outside the flex form row. Verify TWMS server names are correct. |
| `GuildDetailClient`  | Check DB freshness before calling Nexon API. Polling interval 5s (not 3s). Consider skeleton loading instead of plain spinner.                  |
| Guild detail page    | `maxWidth="lg"` is OK for the dual-column distribution layout, but wrap other sections in narrower containers if needed.                        |

### Navigation

Add "工會" link to `components/Navigation.js` between "排行榜" and "關於". Follow the existing nav item pattern (icon + label, active state highlighting by pathname).

### Accessibility Checklist

- [ ] All cards have proper heading hierarchy (h5/h6 inside h4 sections)
- [ ] Tables have proper `<thead>` and scope attributes
- [ ] Charts have `role="img"` and `aria-label` descriptions
- [ ] Pie chart click-to-filter has keyboard support
- [ ] Focus states visible on all interactive elements
- [ ] `prefers-reduced-motion` respected on all hover animations

---

## Known Issues & Deferred Items

Items identified in review, to be addressed during implementation:

1. **Pie chart click-to-filter:** `GuildDistributions` should pass an `onClassFilter` callback to filter the member table when a pie slice is clicked.
2. **Paginated members endpoint:** Spec defines `GET /api/guild/[oguildId]/members` with pagination. Deferred because 200 members is small enough for client-side handling. Add if performance becomes an issue.
3. **Rate limiter retrofit:** The existing `characterSyncService.js` does not use the rate limiter. Should be retrofitted to avoid concurrent API key abuse when guild sync and character sync run simultaneously.
4. **Retry with backoff:** The sync service should retry on 429 errors with exponential backoff (1s, 2s, 4s, max 3 retries) per spec.
