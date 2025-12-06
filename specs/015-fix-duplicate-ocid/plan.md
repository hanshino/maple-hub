# Implementation Plan: 修復 Google Sheet 重複 OCID 問題

**Branch**: `015-fix-duplicate-ocid` | **Date**: 2025-12-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-fix-duplicate-ocid/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

建立一個 cron API 端點來偵測並移除 Google Sheet 中的重複 OCID 記錄。需處理兩個工作表：OCID 主工作表（保留第一筆）和 CombatPower 工作表（保留最新 updated_at 記錄）。支援預覽模式和詳細統計報告。

## Technical Context

**Language/Version**: JavaScript ES2020+  
**Primary Dependencies**: Next.js 15, googleapis (Google Sheets API)  
**Storage**: Google Sheets（OCID 工作表、CombatPower 工作表）  
**Testing**: Jest 30  
**Target Platform**: Vercel (Hobby plan - 10秒執行限制)
**Project Type**: web - Next.js application  
**Performance Goals**: 單次 API 呼叫處理所有重複記錄  
**Constraints**: <10秒執行時間（Vercel Hobby 限制）、Google Sheets API 配額  
**Scale/Scope**: 預期數百至千筆 OCID 記錄

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                   | Status | Notes                                         |
| ------------------------------------------- | ------ | --------------------------------------------- |
| II. API Integration Excellence              | ✅     | 使用 Google Sheets API，實作錯誤處理          |
| VIII. API Security and Architecture         | ✅     | 端點置於 `/api/cron/*`，使用 CRON_SECRET 驗證 |
| XII. Minimalist Implementation Philosophy   | ✅     | 僅實作規格要求的功能                          |
| XIII. Vercel Platform Constraints           | ✅     | 設計需在 10 秒內完成                          |
| XIV. Zero-Cost External Service Integration | ✅     | 使用 Google Sheets（免費配額內）              |

## Project Structure

### Documentation (this feature)

```text
specs/015-fix-duplicate-ocid/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
app/
├── api/
│   └── cron/
│       └── deduplicate-ocid/
│           └── route.js     # New cron API endpoint

lib/
└── googleSheets.js          # Extend with deduplication methods

__tests__/
├── api/
│   └── cron/
│       └── deduplicateOcid.test.js  # API route tests
└── lib/
    └── googleSheets.deduplicate.test.js  # Service method tests
```

**Structure Decision**: 遵循現有專案結構，在 `app/api/cron/` 下新增 `deduplicate-ocid` 端點，去重邏輯實作於 `lib/googleSheets.js`。

## Complexity Tracking

> No violations - feature aligns with all constitution principles.
