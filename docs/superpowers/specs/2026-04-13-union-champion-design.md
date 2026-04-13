# Union Champion Panel Design

## Overview

新增「聯盟冠軍」功能，從 Nexon API `/user/union-champion` 取得資料，儲存至 DB，並在角色頁面以新 tab 展示冠軍角色卡片及徽章效果。

## API Response Schema

```json
{
  "date": "string | null",
  "union_champion": [
    {
      "champion_name": "string",
      "champion_slot": "number (1-based)",
      "champion_grade": "string (SSS / SS / S / A / B / C)",
      "champion_class": "string",
      "champion_badge_info": [
        { "stat": "string" }
      ]
    }
  ],
  "champion_badge_total_info": [
    { "stat": "string" }
  ]
}
```

## Data Layer

### 1. Nexon API Client (`lib/nexonApi.js`)

新增 `getUnionChampion(ocid)` — 呼叫 `/user/union-champion?ocid=`，使用現有 `apiClient`。

### 2. Database Schema (`lib/db/schema.js`)

新增兩張表：

**`character_union_champion`** — 冠軍角色

| Column | Type | Description |
|--------|------|-------------|
| id | int (PK, auto) | |
| ocid | varchar(64) | 角色 OCID |
| championSlot | int | 欄位編號 (1-6) |
| championName | varchar(100) | 冠軍角色名稱 |
| championGrade | varchar(10) | 等級 (SSS/SS/S/A/B/C) |
| championClass | varchar(50) | 職業名稱 |
| updatedAt | timestamp | |

**`character_union_champion_badges`** — 冠軍徽章效果

| Column | Type | Description |
|--------|------|-------------|
| id | int (PK, auto) | |
| ocid | varchar(64) | 角色 OCID |
| championSlot | int | 對應哪個冠軍 slot（nullable，null 表示合計效果） |
| stat | varchar(255) | 效果描述文字 |
| updatedAt | timestamp | |

- `championSlot = null` 的 rows 代表 `champion_badge_total_info`（合計效果）
- `championSlot = 1~6` 的 rows 代表各冠軍的 `champion_badge_info`

### 3. Database Queries (`lib/db/queries.js`)

新增：
- `upsertUnionChampion(ocid, champions)` — 先刪除舊資料再插入（跟 union raider stats 同模式）
- `upsertUnionChampionBadges(ocid, champions, totalInfo)` — 同上
- 在 `getFullCharacterData()` 中加入讀取 champion + badges 資料，回傳格式：

```js
unionChampion: {
  union_champion: [
    {
      champion_name, champion_slot, champion_grade, champion_class,
      champion_badge_info: [{ stat }]
    }
  ],
  champion_badge_total_info: [{ stat }]
}
```

### 4. Sync Service (`lib/characterSyncService.js`)

在現有的 13 個並行 API call 中加入 `getUnionChampion(ocid)` 作為第 14 個。在 sync 流程中呼叫 upsert 函式。

### 5. Migration

新增 Drizzle migration 建立上述兩張表。

## Frontend

### 1. Tab 結構調整 (`components/CharacterDataTabs.js`)

重新排列 tabs，將聯盟系列集中：

```
能力值 | 極限屬性 | 套裝效果 | 聯盟戰地 | 聯盟神器 | 聯盟冠軍 | 符文系統 | 傳授技能
```

常數定義：
```js
const TAB_STATS = 0;
const TAB_HYPER_STAT = 1;
const TAB_SET_EFFECT = 2;
const TAB_UNION_RAIDER = 3;
const TAB_UNION_ARTIFACT = 4;
const TAB_UNION_CHAMPION = 5;
const TAB_RUNES = 6;
const TAB_LINK_SKILL = 7;
```

### 2. UnionChampionPanel (`components/UnionChampionPanel.js`)

新建元件，遵循現有 Panel pattern（PanelSkeleton / PanelError / PanelEmpty / SectionHeader）。

**佈局結構：**

```
┌─────────────────────────────────────────────┐
│ SectionHeader: "聯盟冠軍角色與徽章加成"        │
├─────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │ SSS  │  │ SSS  │  │ SSS  │   ← 3 欄桌面 │
│  │暗夜行者│  │ 琳恩  │  │  蓮   │   ← 2 欄手機 │
│  │影之愛衣│  │琳琳愛衣│  │愛蓮衣 │              │
│  │■■■■■ │  │■■■■■ │  │■■■■■ │              │
│  └──────┘  └──────┘  └──────┘              │
│  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │  A   │  │  🔒  │  │  🔒  │              │
│  │幻影俠盜│  │      │  │      │              │
│  │幻影愛衣│  │      │  │      │              │
│  │■■    │  │      │  │      │              │
│  └──────┘  └──────┘  └──────┘              │
├─────────────────────────────────────────────┤
│ SectionTitle: "總效果"                       │
│ [全屬性+80] [攻/魔+40] [Boss+15%] [爆傷+9%] │
└─────────────────────────────────────────────┘
```

**卡片設計：**

每張 champion card 使用 MUI `Paper variant="outlined"`：
- 左上：Grade 徽章（Chip，根據等級配色）
- 中間：職業名（body2, fontWeight 700）+ 角色名（caption, color text.secondary）
- 底部：徽章數量色塊（小方塊 row，數量 = badge_info.length）
- Hover（桌面）/ Click（手機）：Tooltip 顯示完整 badge 效果文字列表

**Grade 配色：**

| Grade | 背景色 | 邊框色 | 文字色 |
|-------|--------|--------|--------|
| SSS | linear-gradient(#ffd700, #ff8c00) | #ffd700 | #000 |
| SS | #9c27b0 | #9c27b0 | #fff |
| S | #2196f3 | #2196f3 | #fff |
| A | #4caf50 | #4caf50 | #000 |
| B | #9e9e9e | #9e9e9e | #000 |
| C | #616161 | #616161 | #fff |

**空 Slot：**
- Paper variant="outlined" + dashed border
- 中間放 MUI `LockIcon`，color text.disabled
- 填滿 6 個 slot（`champion_slot` 最多 6 個）

**響應式：**
- 桌面：`Grid size={{ xs: 6, md: 4 }}`（3 欄）
- 手機：2 欄

**總效果區：**
- SectionTitle「總效果」
- Chip flex wrap 排列，使用 `variant="outlined"` + `borderColor: primary.light`
- 跟 UnionRaiderPanel 的 Chip 風格一致

### 3. Props 傳遞

`CharacterDataTabs` 新增 `unionChampionData` prop，從 `app/page.js` 透過 API 回傳的 `getFullCharacterData()` 取得。

## Testing

- `UnionChampionPanel` 元件測試：空資料、正常資料、不同 grade 配色
- `nexonApi.getUnionChampion` 單元測試：mock axios
- DB queries 測試：upsert + read

## Out of Scope

- 角色圖片（API 不提供）
- 冠軍等級經驗值/進度（API 不提供）
- 冠軍歷史追蹤
