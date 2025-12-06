# Implementation Plan: Daily Combat Power Tracking

**Branch**: `013-daily-combat-power-tracking` | **Date**: 2025-12-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-daily-combat-power-tracking/spec.md`

## Summary

實作每日定時排程任務，從 Google Sheet 讀取已記錄的 OCID 列表，透過 Nexon API 獲取每個角色的戰鬥力數據，並將結果覆蓋更新回 Google Sheet（每個 OCID 僅保留一筆最新數據）。

技術方案採用 Next.js API Route 作為 cron 端點，結合現有的 GoogleSheetsClient 和 nexonApi 模組，實施速率限制控制和容錯處理。

## Technical Context

**Language/Version**: JavaScript ES2020+, Node.js 18.17+  
**Primary Dependencies**: Next.js 15.5.6, googleapis 167.0.0, axios 1.13.2  
**Storage**: Google Sheets（OCID 來源表 + 戰鬥力記錄表）  
**Testing**: Jest 30.2.0, @testing-library/react 16.3.0  
**Target Platform**: Vercel Hobby Plan (10 秒執行超時限制)
**Project Type**: Web application (Next.js)  
**Performance Goals**: 處理 1000 個 OCID 應在 60 分鐘內完成（透過外部 cron 服務分批觸發）  
**Constraints**: Vercel 10 秒超時限制；需分批處理並設計可中斷/恢復機制  
**Scale/Scope**: 初期目標 1000 個 OCID；每日一次執行

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                   | Status       | Notes                                                                   |
| ------------------------------------------- | ------------ | ----------------------------------------------------------------------- |
| II. API Integration Excellence              | ✅ Pass      | 使用現有 nexonApi 模組；設計可外部呼叫的 cron 端點                      |
| VIII. API Security and Architecture         | ✅ Pass      | Cron 端點放置於 `/api/cron/combat-power-refresh`；使用 CRON_SECRET 認證 |
| XII. Minimalist Implementation Philosophy   | ✅ Pass      | 復用現有 GoogleSheetsClient 和 nexonApi；不過度抽象                     |
| XIII. Vercel Platform Constraints           | ⚠️ Addressed | 10 秒超時限制 → 採用分批處理策略（每批約 10-15 個 OCID）                |
| XIV. Zero-Cost External Service Integration | ✅ Pass      | 使用 cron-job.org 或 GitHub Actions 觸發；Google Sheets 免費額度        |

**Gate Result**: ✅ PASS - 所有約束已識別並有對應解決方案

## Project Structure

### Documentation (this feature)

```text
specs/013-daily-combat-power-tracking/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── cron-api.yaml    # OpenAPI spec for cron endpoint
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/
└── api/
    └── cron/
        └── combat-power-refresh/
            └── route.js           # Cron API endpoint (NEW)

lib/
├── googleSheets.js                # Extended with combat power methods
├── nexonApi.js                    # Existing - getCharacterStats
├── combatPowerService.js          # Combat power processing logic (NEW)
└── cache.js                       # Existing cache utilities

__tests__/
├── api/
│   └── cron/
│       └── combatPowerRefresh.test.js    # API route tests (NEW)
└── lib/
    └── combatPowerService.test.js        # Service unit tests (NEW)
```

**Structure Decision**: 採用現有的 Next.js App Router 結構，在 `/app/api/cron/` 下新增端點。新增獨立的 `combatPowerService.js` 處理業務邏輯，擴展現有的 `googleSheets.js` 增加戰鬥力相關方法。

## Complexity Tracking

| Violation    | Why Needed           | Simpler Alternative Rejected Because |
| ------------ | -------------------- | ------------------------------------ |
| 分批處理邏輯 | Vercel 10 秒超時限制 | 單次處理所有 OCID 會超時             |

## Post-Design Constitution Check

_Re-evaluated after Phase 1 design completion._

| Principle                           | Status       | Notes                                                                    |
| ----------------------------------- | ------------ | ------------------------------------------------------------------------ |
| II. API Integration Excellence      | ✅ Pass      | 使用現有 nexonApi.getCharacterStats；cron 端點設計符合外部調用需求       |
| VIII. API Security and Architecture | ✅ Pass      | 端點位於 `/api/cron/combat-power-refresh`；CRON_SECRET Bearer Token 認證 |
| X. MUI Component Maximization       | ✅ N/A       | 此功能無 UI 組件                                                         |
| XII. Minimalist Implementation      | ✅ Pass      | 僅新增 1 個 API route + 1 個 service 檔案；復用現有 GoogleSheetsClient   |
| XIII. Vercel Constraints            | ✅ Addressed | 分批處理設計（每批 15 OCID，約 5 秒執行時間）符合 10 秒限制              |
| XIV. Zero-Cost Integration          | ✅ Pass      | cron-job.org（免費）+ Google Sheets API（免費額度）                      |

**Final Gate Result**: ✅ PASS - 設計完全符合 Constitution 要求

## Generated Artifacts

| Artifact     | Path                                                 | Description                    |
| ------------ | ---------------------------------------------------- | ------------------------------ |
| Research     | [research.md](./research.md)                         | 技術研究和決策記錄             |
| Data Model   | [data-model.md](./data-model.md)                     | 實體定義和 Google Sheet Schema |
| API Contract | [contracts/cron-api.yaml](./contracts/cron-api.yaml) | OpenAPI 3.0 規格               |
| Quickstart   | [quickstart.md](./quickstart.md)                     | 快速開始指南                   |

## Next Steps

1. 執行 `/speckit.tasks` 生成具體任務清單
2. 按照任務清單實作功能
3. 設定外部 cron 服務（cron-job.org）進行每日排程
