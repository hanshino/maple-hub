# Research: Daily Combat Power Tracking

**Feature**: 013-daily-combat-power-tracking  
**Date**: 2025-12-06  
**Status**: Complete

## Research Tasks

### 1. Vercel 10 秒超時限制的分批處理策略

**Decision**: 採用分批處理 + 外部 cron 多次觸發

**Rationale**:

- Vercel Hobby Plan 限制 Serverless Function 執行時間為 10 秒
- 每次 Nexon API 調用約需 200-500ms（含網路延遲）
- 考慮安全邊際，每批處理約 10-15 個 OCID
- 使用 Google Sheet 記錄處理進度（offset），支援斷點續傳

**Alternatives considered**:

1. ❌ 升級 Vercel Pro Plan（需付費，違反 Zero-Cost 原則）
2. ❌ Edge Functions（更短的執行時間限制）
3. ✅ 分批處理 + 外部 cron 多次觸發（零成本，符合現有架構）

### 2. Google Sheets 戰鬥力數據存儲結構

**Decision**: 使用獨立的工作表（Sheet）存儲戰鬥力數據，採用 OCID 作為主鍵進行覆蓋更新

**Rationale**:

- 現有 Google Sheet 的 Column A 已用於存儲 OCID
- 戰鬥力數據需要獨立管理（OCID, 戰鬥力數值, 更新時間）
- 使用 `batchUpdate` API 進行高效的批量更新
- 每個 OCID 僅一列，覆蓋更新而非追加

**Schema**:
| Column | Field | Description |
|--------|-------|-------------|
| A | OCID | 角色唯一識別碼（主鍵） |
| B | combat_power | 戰鬥力數值（字串型，支援大數字） |
| C | updated_at | 最後更新時間（ISO 8601 格式） |
| D | status | 處理狀態（success/error/not_found） |

**Alternatives considered**:

1. ❌ 同一工作表追加列（每日增加一列）→ 違反「僅保留一筆」需求
2. ❌ 每日新建工作表 → 管理複雜，查詢困難
3. ✅ 獨立工作表 + 覆蓋更新 → 簡潔，符合需求

### 3. Nexon API 速率限制控制

**Decision**: 每次 API 請求間隔 300ms，遇到 429 錯誤時指數退避重試

**Rationale**:

- 現有 apiInterceptor.js 在開發環境已有 200ms 延遲
- Nexon API 官方無明確速率限制文檔，但過快請求會返回 429
- 採用保守策略：300ms 間隔 + 最多 3 次重試

**Implementation**:

```javascript
const RATE_LIMIT_DELAY = 300; // ms
const MAX_RETRIES = 3;
const BACKOFF_MULTIPLIER = 2;
```

**Alternatives considered**:

1. ❌ 無延遲（可能觸發速率限制）
2. ❌ 1 秒延遲（處理速度太慢）
3. ✅ 300ms + 指數退避（平衡速度與穩定性）

### 4. 錯誤處理與容錯機制

**Decision**: 單一 OCID 失敗不影響整體任務；記錄錯誤狀態到 Google Sheet

**Rationale**:

- 符合 FR-006：單個 OCID 處理失敗時繼續處理其他 OCID
- 錯誤類型包括：API 錯誤、角色不存在、網路超時
- 錯誤信息寫入 Google Sheet 的 status 列，便於後續排查

**Error Handling Strategy**:
| Error Type | Action |
|------------|--------|
| 429 Rate Limited | 指數退避重試（最多 3 次） |
| 404 Not Found | 標記 status="not_found"，繼續處理 |
| 5xx Server Error | 標記 status="error"，繼續處理 |
| Network Timeout | 標記 status="error"，繼續處理 |

### 5. Cron 端點認證機制

**Decision**: 沿用現有的 CRON_SECRET Bearer Token 認證

**Rationale**:

- 現有 `/api/sync-ocids` 已實作此機制
- 符合 Vercel 官方建議的 cron 端點保護方式
- 與 cron-job.org 等外部服務相容

**Implementation**:

```javascript
const authHeader = request.headers.get('Authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 6. 進度追蹤與斷點續傳

**Decision**: 使用 URL 查詢參數傳遞批次資訊（offset, batchSize）

**Rationale**:

- Vercel Serverless Functions 是無狀態的
- 外部 cron 服務（如 cron-job.org）可以配置多個任務，每個任務處理不同批次
- 或使用單一任務 + 遞迴調用（任務完成後自動觸發下一批次）

**API Design**:

```
GET /api/cron/combat-power-refresh?offset=0&batchSize=15
```

**Response** (用於鏈式調用):

```json
{
  "success": true,
  "processed": 15,
  "nextOffset": 15,
  "hasMore": true,
  "stats": { "success": 14, "failed": 1 }
}
```

## Summary of Decisions

| Topic    | Decision                       |
| -------- | ------------------------------ |
| 超時處理 | 分批處理（每批 10-15 OCID）    |
| 數據存儲 | 獨立工作表 + OCID 主鍵覆蓋更新 |
| 速率限制 | 300ms 間隔 + 指數退避          |
| 錯誤處理 | 單一失敗不中斷 + 狀態記錄      |
| 認證     | CRON_SECRET Bearer Token       |
| 進度追蹤 | URL 參數 offset/batchSize      |

## Resolved Clarifications

All technical uncertainties have been resolved through research. No remaining NEEDS CLARIFICATION items.
