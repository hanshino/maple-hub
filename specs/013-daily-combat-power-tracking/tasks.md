# Tasks: Daily Combat Power Tracking

**Input**: Design documents from `/specs/013-daily-combat-power-tracking/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Included - following project testing conventions with Jest

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this is a Next.js web application:

- **API Routes**: `app/api/`
- **Library**: `lib/`
- **Tests**: `__tests__/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 確認專案結構和環境準備就緒

- [ ] T001 確認 Google Sheet 中已建立 `CombatPower` 工作表，包含標題行（ocid, combat_power, updated_at, status）
- [ ] T002 確認 CRON_SECRET 環境變數已設定（開發和生產環境）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 擴展現有基礎設施以支援戰鬥力數據處理

**⚠️ CRITICAL**: User Story 1 需要這些基礎方法才能實作

- [ ] T003 擴展 `lib/googleSheets.js` 新增 `getAllOcids()` 方法以分頁讀取所有 OCID
- [ ] T004 擴展 `lib/googleSheets.js` 新增 `getCombatPowerSheet()` 方法取得或建立 CombatPower 工作表
- [ ] T005 擴展 `lib/googleSheets.js` 新增 `upsertCombatPowerRecords(records)` 方法批量覆蓋更新戰鬥力記錄
- [ ] T006 [P] 新增 `__tests__/lib/googleSheets.combatPower.test.js` 測試新增的 Google Sheets 方法

**Checkpoint**: Foundation ready - GoogleSheetsClient 已具備戰鬥力數據操作能力

---

## Phase 3: User Story 1 - Daily Automated Combat Power Collection (Priority: P1) 🎯 MVP

**Goal**: 系統每天自動從 OCID 列表獲取戰鬥力數據並記錄到 Google Sheet

**Independent Test**: 手動呼叫 `/api/cron/combat-power-refresh?offset=0&batchSize=5` 並驗證 Google Sheet 中出現對應的戰鬥力記錄

### Tests for User Story 1

- [ ] T007 [P] [US1] 建立 `__tests__/lib/combatPowerService.test.js` 測試 `fetchCombatPower()` 方法
- [ ] T008 [P] [US1] 建立 `__tests__/lib/combatPowerService.test.js` 測試 `processBatch()` 方法的容錯處理
- [ ] T009 [P] [US1] 建立 `__tests__/api/cron/combatPowerRefresh.test.js` 測試 API 端點認證和響應格式

### Implementation for User Story 1

- [ ] T010 [US1] 建立 `lib/combatPowerService.js` 實作 `fetchCombatPower(ocid)` 方法
  - 呼叫 `getCharacterStats(ocid)` 獲取角色數據
  - 從 `final_stat` 中提取 `stat_name === '戰鬥力'` 的 `stat_value`
  - 實作 300ms 延遲和指數退避重試邏輯
- [ ] T011 [US1] 擴展 `lib/combatPowerService.js` 實作 `processBatch(ocids)` 方法
  - 迭代處理每個 OCID
  - 單一 OCID 失敗不中斷整體處理
  - 返回處理結果（success/failed/notFound 統計）
- [ ] T012 [US1] 建立 `app/api/cron/combat-power-refresh/route.js` 實作 GET 端點
  - CRON_SECRET Bearer Token 認證
  - 解析 offset 和 batchSize 查詢參數
  - 呼叫 GoogleSheetsClient 讀取 OCID 列表
  - 呼叫 combatPowerService.processBatch() 處理
  - 呼叫 GoogleSheetsClient 寫入結果
  - 返回符合 contracts/cron-api.yaml 的響應格式

**Checkpoint**: User Story 1 完成 - 可透過 curl 手動測試戰鬥力收集功能

---

## Phase 4: User Story 2 - Task Execution Monitoring (Priority: P2)

**Goal**: 系統記錄並返回任務執行的詳細統計資訊

**Independent Test**: 呼叫 API 並驗證響應包含 stats（success, failed, notFound）、executionTimeMs 等欄位

### Tests for User Story 2

- [ ] T013 [P] [US2] 擴展 `__tests__/api/cron/combatPowerRefresh.test.js` 測試執行統計響應格式

### Implementation for User Story 2

- [ ] T014 [US2] 擴展 `lib/combatPowerService.js` 新增 `TaskExecutionStats` 統計收集
  - 記錄開始時間、結束時間
  - 累計 success、failed、notFound 計數
  - 計算 executionTimeMs
- [ ] T015 [US2] 擴展 `app/api/cron/combat-power-refresh/route.js` 在響應中包含完整統計
  - 添加 console.log 日誌輸出（供 Vercel 日誌查看）
  - 響應包含 stats 和 executionTimeMs

**Checkpoint**: User Story 2 完成 - API 響應包含完整的執行統計資訊

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 完善功能、處理邊界情況

- [ ] T016 [P] 處理 Edge Case：Google Sheet 中無 OCID 時優雅返回空結果
- [ ] T017 [P] 處理 Edge Case：Nexon API 429 速率限制的指數退避重試
- [ ] T018 [P] 處理 Edge Case：角色不存在（404）時標記 status=not_found
- [ ] T019 更新 `specs/013-daily-combat-power-tracking/quickstart.md` 驗證所有步驟可執行
- [ ] T020 執行 `npm run lint` 和 `npm run format` 確保程式碼品質

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (擴展 GoogleSheetsClient)
    ↓
Phase 3: User Story 1 (核心戰鬥力收集) ← MVP
    ↓
Phase 4: User Story 2 (監控統計)
    ↓
Phase 5: Polish
```

### User Story Dependencies

- **User Story 1 (P1)**: 依賴 Phase 2 完成 - 這是 MVP，可獨立交付
- **User Story 2 (P2)**: 建立在 US1 的實作之上，擴展統計功能

### Within Each User Story

1. 測試先寫（T007-T009 for US1, T013 for US2）
2. 核心服務層實作（combatPowerService.js）
3. API 端點實作（route.js）
4. 整合測試驗證

### Parallel Opportunities

**Phase 2 內部:**

- T003, T004, T005 需依序執行（都修改同一檔案）
- T006 可在 T003-T005 完成後執行

**Phase 3 (US1) 內部:**

- T007, T008, T009 可並行執行（不同測試檔案）
- T010 必須先於 T011
- T011 必須先於 T012

**Phase 4 (US2) 內部:**

- T013 可與 T014 並行執行
- T15 依賴 T014

**Phase 5 內部:**

- T016, T017, T018 可並行執行（不同邊界情況）

---

## Implementation Strategy

### MVP Scope (Recommended First Delivery)

完成 Phase 1-3 即可交付可用的戰鬥力收集功能：

- 手動觸發 API 可收集戰鬥力數據
- 數據正確寫入 Google Sheet
- 容錯處理確保穩定性

### Full Feature Scope

完成所有 Phase 提供完整功能：

- 詳細的執行統計
- 完善的邊界情況處理
- 完整的測試覆蓋

---

## Total Task Count

| Phase                 | Tasks  | Description             |
| --------------------- | ------ | ----------------------- |
| Phase 1: Setup        | 2      | 環境確認                |
| Phase 2: Foundational | 4      | GoogleSheetsClient 擴展 |
| Phase 3: User Story 1 | 6      | 核心功能實作            |
| Phase 4: User Story 2 | 3      | 監控統計                |
| Phase 5: Polish       | 5      | 邊界處理和品質          |
| **Total**             | **20** |                         |

### Tasks per User Story

- **User Story 1 (P1)**: 6 tasks (T007-T012)
- **User Story 2 (P2)**: 3 tasks (T013-T015)
