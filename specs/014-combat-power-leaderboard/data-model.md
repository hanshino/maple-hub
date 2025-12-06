# Data Model: 戰力排行榜頁面

**Feature**: 014-combat-power-leaderboard  
**Date**: 2025-12-06

## Entities

### 1. LeaderboardEntry (排行榜項目)

整合戰力數據與角色基本資訊的複合資料結構（API 回應）。

| 欄位            | 類型   | 必填 | 說明                    |
| --------------- | ------ | ---- | ----------------------- |
| rank            | number | ✓    | 排名順位 (1-based)      |
| ocid            | string | ✓    | 角色唯一識別碼          |
| combat_power    | number | ✓    | 戰力數值                |
| updated_at      | string | ✓    | 戰力更新時間 (ISO 8601) |
| character_name  | string |      | 角色名稱 (來自快取)     |
| character_level | number |      | 角色等級 (來自快取)     |
| character_image | string |      | 角色圖示 URL (來自快取) |
| world_name      | string |      | 伺服器名稱 (來自快取)   |
| character_class | string |      | 職業名稱 (來自快取)     |

**備註**: 角色詳情來自 CharacterInfo 快取工作表，非即時呼叫 Nexon API

---

### 2. LeaderboardState (排行榜狀態)

客戶端無限滾動狀態管理。

| 欄位        | 類型               | 說明               |
| ----------- | ------------------ | ------------------ |
| entries     | LeaderboardEntry[] | 已載入的排行榜項目 |
| totalCount  | number             | 總筆數             |
| loadedCount | number             | 已載入筆數         |
| isLoading   | boolean            | 是否正在載入下一批 |
| hasMore     | boolean            | 是否還有更多資料   |
| error       | string \| null     | 錯誤訊息           |

---

### 3. CombatPowerRecord (戰力記錄 - 現有)

Google Sheet CombatPower 工作表的資料結構。

| 欄位         | 類型   | 說明                           |
| ------------ | ------ | ------------------------------ |
| ocid         | string | 角色唯一識別碼                 |
| combat_power | string | 戰力數值 (字串格式)            |
| updated_at   | string | 更新時間                       |
| status       | string | 狀態 (success/error/not_found) |

---

### 4. CharacterInfoCache (角色資訊快取 - 新增)

Google Sheet CharacterInfo 工作表，用於快取角色基本資訊。

| 欄位            | 類型   | 必填 | 說明                  |
| --------------- | ------ | ---- | --------------------- |
| ocid            | string | ✓    | 角色唯一識別碼 (主鍵) |
| character_name  | string | ✓    | 角色名稱              |
| character_level | number | ✓    | 角色等級              |
| character_image | string |      | 角色圖示 URL          |
| world_name      | string | ✓    | 伺服器名稱            |
| character_class | string |      | 職業名稱              |
| cached_at       | string | ✓    | 快取時間 (ISO 8601)   |

**快取策略**:

- 有效期: 6 小時
- 更新方式: 背景 CRON 任務
- 若快取不存在: 回傳部分資料（無角色詳情）

---

## 資料流程

```
┌─────────────────────────────────────────────────────────────────┐
│                    GET /api/leaderboard                         │
│  1. 從 CombatPower 取得 OCID + 戰力列表                         │
│  2. 排序 (combat_power DESC, ocid ASC)                          │
│  3. 分頁 (offset, limit)                                        │
│  4. 從 CharacterInfo 批量取得角色詳情                           │
│  5. 合併資料並回傳                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Client (React)                               │
│  - 直接顯示完整排行榜資訊                                        │
│  - 無需額外 API 呼叫                                             │
│  - 無限滾動載入更多                                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              CRON: /api/cron/update-character-info              │
│  (每 6 小時執行，由外部 CRON 服務觸發)                           │
│  1. 取得所有 OCID                                                │
│  2. 逐一呼叫 Nexon API (300ms 延遲)                              │
│  3. 批量更新 CharacterInfo 工作表                                │
└─────────────────────────────────────────────────────────────────┘
```

## 驗證規則

### LeaderboardEntry

- `rank` MUST be positive integer ≥ 1
- `ocid` MUST be non-empty string
- `combat_power` MUST be non-negative number
- `character_level` MUST be positive integer when present

### API 請求參數

- `offset` MUST be non-negative integer, default 0
- `limit` MUST be positive integer 1-100, default 20
