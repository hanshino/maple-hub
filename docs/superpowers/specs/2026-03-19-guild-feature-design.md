# Guild Feature Design

## Overview

Add guild browsing and analysis to Maple Hub. Users can search for a guild or click through from a character page to view guild members, rankings, class/level distributions, and their own position within the guild.

## Data Source

### Nexon Guild API

Two new endpoints to integrate:

| Endpoint | Params | Returns |
|----------|--------|---------|
| `GET /maplestory/v1/guild/id` | `guild_name`, `world_name` | `oguild_id` |
| `GET /maplestory/v1/guild/basic` | `oguild_id`, `date?` | Full guild info (see below) |

**Guild Basic response fields:**
- `guild_name`, `world_name`, `guild_level`, `guild_fame`, `guild_point`
- `guild_master_name`, `guild_member_count`
- `guild_member: string[]` — full member name list (up to 200)
- `guild_skill[]` — name, description, level, effect, icon
- `guild_noblesse_skill[]` — same structure
- `guild_mark`, `guild_mark_custom`

### Member Data

Each member's details come from the existing character basic API (`/maplestory/v1/id` + `/maplestory/v1/character/basic`), which provides level, class, combat power, exp rate, image, etc.

Advanced data (equipment, HEXA, symbols, union) is **not** fetched for the guild feature in MVP. If a member already has full data in the DB from a prior search, that data is available but not actively fetched.

## Prerequisites

- **Extract OCID lookup into `nexonApi.js`**: The current OCID lookup is inline in the search API route. Extract it as a reusable `getCharacterOcid(characterName)` function in `lib/nexonApi.js` before implementing guild sync.

## Constraints

- **Guild size:** up to 200 members.
- **Rate limit:** 5 requests/second on the Nexon API (shared across all features).
- **Per-member cost:** 2 API calls (OCID lookup + character basic).
- **Worst case (200 new members):** 400 calls = ~80 seconds. With retries and contention, expect 1-3 minutes for large guilds.
- **Best case (all cached):** 0 calls, instant.

## Data Sync Strategy

```
User searches guild
  → Guild API: 2 calls (instant)
  → Check DB for each member:
      - Fresh (synced <10 min ago): use cached data
      - Stale or missing: queue for background sync
  → Show available data immediately
  → Background worker syncs remaining members at 5 req/s
  → Frontend polls sync status, progressively updates UI
  → Cron job refreshes tracked guilds every 6-12 hours
```

Key principle: **show what we have, fetch what we don't, never block the user.**

## DB Schema

### `guilds` table

| Column | Type | Notes |
|--------|------|-------|
| `oguild_id` | varchar(64) | PK |
| `guild_name` | varchar(100) | indexed |
| `world_name` | varchar(20) | |
| `guild_level` | int | |
| `guild_fame` | int | |
| `guild_point` | int | |
| `guild_master_name` | varchar(50) | |
| `guild_member_count` | int | |
| `guild_mark` | text | base64 image |
| `guild_mark_custom` | text | base64 custom image |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

Index: `idx_guild_name_world` on (`guild_name`, `world_name`).

### `guild_skills` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | int | PK, auto-increment |
| `oguild_id` | varchar(64) | FK → guilds |
| `skill_type` | varchar(10) | 'regular' or 'noblesse' |
| `skill_name` | varchar(100) | |
| `skill_description` | text | |
| `skill_level` | int | |
| `skill_effect` | text | |
| `skill_icon` | text | icon URL |

Unique index: `idx_guild_skill_unique` on (`oguild_id`, `skill_type`, `skill_name`). Sync uses delete-then-insert per guild (same pattern as existing equipment sync).

### `guild_members` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | int | PK, auto-increment |
| `oguild_id` | varchar(64) | FK → guilds |
| `character_name` | varchar(50) | denormalized for display before sync |
| `ocid` | varchar(64) | FK → characters, nullable (null until OCID resolved) |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

Character details are joined from `characters` table via `ocid`. The `character_name` is kept denormalized so we can display the member list immediately from the guild API response before OCID resolution.

**Member list sync logic:** On each guild refresh, compare the API member list with existing DB rows. Add new members, remove members no longer in the list. This handles members joining/leaving the guild.

## Page Structure

### `/guild` — Guild Search Page

- Search input for guild name
- Server/world dropdown selector
- Recent guild searches (localStorage)
- Similar layout to the existing character search

### `/guild/[server]/[guildName]` — Guild Detail Page

URL uses the server name and guild name for readability and shareability. Example: `/guild/艾麗亞/楓之谷大冒險`.

The page resolves the URL params to an `oguild_id` via the search API, then loads guild data.

**Sections:**

1. **Guild Info Card**
   - Guild name, mark/emblem, server, level, fame, points
   - Master name (clickable → character page)
   - Member count
   - Guild skills list (regular + noblesse)

2. **Member Leaderboard**
   - Table: rank, character name (clickable), level, class, combat power
   - Sortable by level, combat power
   - Search/filter within members
   - Sync progress indicator when members are still loading

3. **Class Distribution**
   - Pie chart (Recharts) showing class breakdown
   - Click a slice to filter the leaderboard

4. **Level Distribution**
   - Histogram with buckets (200-209, 210-219, 220-229, etc.)
   - Visual indicator of where the user's character falls

5. **"My Position" Panel**
   - User selects their character (search or recent)
   - Highlights their row in the leaderboard
   - Shows: combat power rank, level rank, PR percentile
   - "X members ahead of you, Y members behind"

6. **"Guild Highlights"**
   - Fun badges: highest level, strongest combat power, most popular class, etc.

### Character Page Enhancement

Add a clickable guild name badge on the existing character detail page. Clicking navigates to `/guild/[server]/[guildName]`.

## API Routes

### `GET /api/guild/search?name=xxx&world=xxx`

- Calls Nexon guild ID + guild basic APIs
- Upserts guild info + member list to DB
- Triggers background sync for uncached members
- Returns guild basic info + member names + sync status

### `GET /api/guild/[oguildId]`

- Returns guild info from DB
- Includes member details (joined with `characters` table)
- Returns sync status (total members, synced count, in-progress)

### `GET /api/guild/[oguildId]/sync-status`

- Lightweight polling endpoint
- Returns: `{ total, synced, inProgress, estimatedSecondsRemaining }`

### `GET /api/guild/[oguildId]/members`

- Paginated member list with sorting options
- Joins guild_members with characters table for full details

## Background Sync Worker

### Centralized Rate Limiter

Create `lib/rateLimiter.js` — a shared token-bucket rate limiter (in-memory, 5 tokens/sec). **All** Nexon API calls must go through it: character sync, guild sync, and cron jobs. This prevents concurrent operations from exceeding the rate limit.

### Guild Member Sync Function

Create `syncCharacterBasicOnly(characterName)` in `lib/guildSyncService.js`:
1. Call `getCharacterOcid(characterName)` → get OCID
2. Call `getCharacterBasicInfo(ocid)` → get basic info
3. Upsert into `characters` table (basic fields only: name, level, class, combat power, exp rate, image, guild name)
4. Update `guild_members.ocid` for this member

This is distinct from the full `syncCharacter()` which makes 13 API calls.

### Sync Queue & Status

- **Sync queue:** Redis list with key `guild:sync:queue:{oguild_id}`, containing member names to sync.
- **Sync status:** Redis hash with key `guild:sync:status:{oguild_id}`, fields: `total`, `synced`, `failed`, `startedAt`. TTL: 10 minutes (auto-cleanup).
- **Deduplication:** Before starting a sync, check if `guild:sync:status:{oguild_id}` exists and is in-progress. If so, skip (don't start a duplicate sync).
- **On server restart:** Stale sync jobs expire via Redis TTL. No recovery needed — the next user visit triggers a fresh sync.

### Sync Flow

1. Guild search API upserts guild info + member list to DB
2. Identifies members needing sync (no OCID, or stale >10 min)
3. Pushes member names to Redis sync queue
4. Async worker pops from queue, calls `syncCharacterBasicOnly()` through the rate limiter
5. Updates sync status in Redis after each member
6. Frontend polls `/api/guild/[oguildId]/sync-status`

### Error Handling During Sync

- **Member not found (404):** Skip, mark as failed in sync status. Don't retry.
- **Rate limit exceeded (429):** Exponential backoff (1s, 2s, 4s), max 3 retries. If still failing, pause the entire sync for 10 seconds.
- **Other API errors (500, timeout):** Skip member, mark as failed. Continue with remaining members.
- **Partial failure:** Sync continues through all members. Final status reports `{ synced: 180, failed: 20, total: 200 }`. UI shows "180/200 members loaded, 20 unavailable."

## Cron Integration

Extend `lib/cron.js`:
- **Every 6 hours:** refresh guilds that have been viewed in the last 7 days
- Re-fetch guild basic info (member list may change — handles joins/leaves)
- Re-sync stale member basic data through the shared rate limiter
- Cron jobs respect the same centralized rate limiter as user-triggered syncs

## Caching

- **Redis:** Guild basic info cached with 10-min TTL (same as character data)
- **Redis:** Sync status stored with short TTL for polling
- **DB:** Guild and member data persisted for long-term use
- **localStorage:** Recent guild searches on the client

## Error Handling

| Scenario | API Response | UI Behavior |
|----------|-------------|-------------|
| Guild not found | 404 from Nexon guild ID API | "找不到此工會" message on search page |
| Guild with 0 members | Empty `guild_member` array | Show guild info card, empty member section with message |
| Member character deleted | 404 from OCID or basic API | Skip member, show as "無法取得資料" in member list |
| Rate limit exceeded | 429 from Nexon | Backoff + retry (see sync worker section) |
| Nexon API down | 500/503 | Show cached data if available, error banner if not |
| Unicode URL decode error | — | `decodeURIComponent` on route params, fallback to 404 page |

### "My Position" Edge Cases

- **User hasn't selected a character:** Show a prompt "選擇你的角色來查看你在工會中的位置"
- **User's character is not in this guild:** Show the panel but note "你的角色不在此工會中"
- **User's character data not yet synced:** Show "資料同步中..." with the sync progress

## Design

Follow existing Maple Hub conventions:
- Glassmorphism cards with `backdropFilter: blur` and translucent backgrounds
- Orange primary (`#f7931e`), cream background (`#fff7ec`)
- MUI 7 components + Tailwind CSS 4 utilities
- Recharts for pie chart and histogram
- Hover effects with `translateY` + `boxShadow`
- Responsive layout, light/dark mode support

## Out of Scope (Phase 2)

- Equipment score analysis (requires full character data fetch)
- HEXA completion ranking
- Symbol progress ranking
- Guild combat power trend over time
- Radar chart comparison (member vs guild average)
- Level-up race / experience growth competition (separate page)

## Testing

- Unit tests for guild sync logic and data transformations
- API route tests with mocked Nexon API responses
- Component tests for guild search and detail page
- Mock guild data fixtures (small guild ~10 members, large guild ~200 members)
