# Data Model: Daily Combat Power Tracking

**Feature**: 013-daily-combat-power-tracking  
**Date**: 2025-12-06  
**Status**: Complete

## Entities

### 1. CombatPowerRecord

代表角色的最新戰鬥力快照，存儲於 Google Sheet 的獨立工作表中。

| Field        | Type   | Description                      | Validation                |
| ------------ | ------ | -------------------------------- | ------------------------- |
| ocid         | string | 角色唯一識別碼（主鍵）           | Required, non-empty       |
| combat_power | string | 戰鬥力數值（字串型以支援大數字） | Required, numeric string  |
| updated_at   | string | 最後更新時間（ISO 8601）         | Required, valid ISO date  |
| status       | enum   | 處理狀態                         | success, error, not_found |

**Storage**: Google Sheet `CombatPower` 工作表

**Relationships**:

- References OCID from existing OCID collection sheet (Column A)

**State Transitions**:

```
[Not Exists] → [Created with status=success]
[Exists] → [Updated with new combat_power and updated_at]
[API Error] → [Updated with status=error]
[Character Not Found] → [Updated with status=not_found]
```

### 2. BatchProcessingState

代表分批處理的狀態資訊，透過 API 請求/響應傳遞（無持久化）。

| Field      | Type    | Description              |
| ---------- | ------- | ------------------------ |
| offset     | number  | 當前批次的起始位置       |
| batchSize  | number  | 每批處理的 OCID 數量     |
| totalCount | number  | OCID 總數                |
| processed  | number  | 本批次已處理數量         |
| hasMore    | boolean | 是否還有更多 OCID 待處理 |

**Storage**: Stateless（透過 API 參數傳遞）

### 3. TaskExecutionStats

代表單次任務執行的統計資訊，用於監控和日誌記錄。

| Field           | Type   | Description              |
| --------------- | ------ | ------------------------ |
| startTime       | string | 任務開始時間（ISO 8601） |
| endTime         | string | 任務結束時間（ISO 8601） |
| totalProcessed  | number | 總處理筆數               |
| successCount    | number | 成功筆數                 |
| failedCount     | number | 失敗筆數                 |
| notFoundCount   | number | 角色不存在筆數           |
| executionTimeMs | number | 執行時間（毫秒）         |

**Storage**: API Response（可選擇記錄到日誌或 Google Sheet）

## Google Sheet Schema

### Sheet 1: OCIDs (Existing)

現有的 OCID 收集表，作為戰鬥力收集的數據來源。

| Column | Field | Description    |
| ------ | ----- | -------------- |
| A      | ocid  | 角色唯一識別碼 |

### Sheet 2: CombatPower (New)

新建的戰鬥力記錄表。

| Column | Field        | Type   | Description            |
| ------ | ------------ | ------ | ---------------------- |
| A      | ocid         | string | 角色唯一識別碼（主鍵） |
| B      | combat_power | string | 戰鬥力數值             |
| C      | updated_at   | string | 最後更新時間           |
| D      | status       | string | 處理狀態               |

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   External      │     │   Next.js API   │     │  Google Sheets  │
│   Cron Service  │────▶│   /api/cron/    │────▶│  CombatPower    │
│                 │     │   combat-power  │     │  Sheet          │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Nexon API     │
                        │   /character/   │
                        │   stat          │
                        └─────────────────┘
```

## Validation Rules

1. **OCID**: 必須為非空字串，來源於現有的 OCID 收集表
2. **combat_power**: 必須為有效的數字字串（可能非常大，使用字串型存儲）
3. **updated_at**: 必須為有效的 ISO 8601 日期時間格式
4. **status**: 必須為 `success`、`error` 或 `not_found` 之一
5. **batchSize**: 必須為正整數，最大值 20（考慮 10 秒超時限制）
6. **offset**: 必須為非負整數

## Constraints

- 每個 OCID 在 CombatPower 工作表中僅有一列（唯一約束）
- 每次更新覆蓋現有記錄，不保留歷史數據
- 批次大小受 Vercel 10 秒超時限制，建議值 10-15
