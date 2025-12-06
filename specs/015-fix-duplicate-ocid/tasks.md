# Tasks: 修復 Google Sheet 重複 OCID 問題

**Input**: Design documents from `/specs/015-fix-duplicate-ocid/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:

- API routes: `app/api/cron/deduplicate-ocid/`
- Library: `lib/`
- Tests: `__tests__/`

---

## Phase 1: Setup

**Purpose**: Basic structure verification

- [ ] T001 Verify existing project structure and dependencies are in place

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Create API route directory at app/api/cron/deduplicate-ocid/

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 定期清理重複 OCID 數據 (Priority: P1) 🎯 MVP

**Goal**: 建立 cron API 端點，自動偵測並移除 Google Sheet 中的重複 OCID 記錄

**Independent Test**: 呼叫 API 端點並檢查 Google Sheet 中重複記錄是否被移除

### Implementation for User Story 1

- [ ] T003 [P] [US1] Implement deduplicateOcidSheet method in lib/googleSheets.js - 掃描 OCID 工作表找出重複記錄，保留第一筆出現的記錄
- [ ] T004 [P] [US1] Implement deduplicateCombatPowerSheet method in lib/googleSheets.js - 掃描 CombatPower 工作表找出重複記錄，保留 updated_at 最新的記錄
- [ ] T005 [US1] Create API route handler GET in app/api/cron/deduplicate-ocid/route.js - 實作驗證、呼叫去重方法、回傳結果
- [ ] T006 [US1] Add authorization validation using CRON_SECRET in app/api/cron/deduplicate-ocid/route.js
- [ ] T007 [US1] Handle edge cases in deduplication methods - 空工作表、不存在的工作表、空白 OCID 值

**Checkpoint**: User Story 1 完成 - API 可執行完整去重操作

---

## Phase 4: User Story 2 - 取得重複數據統計報告 (Priority: P2)

**Goal**: 支援預覽模式（dry-run），讓管理員能在執行前查看重複數據統計

**Independent Test**: 以 dryRun=true 呼叫 API，確認回傳統計資料但不修改數據

### Implementation for User Story 2

- [ ] T008 [US2] Add dryRun query parameter parsing in app/api/cron/deduplicate-ocid/route.js
- [ ] T009 [US2] Extend deduplicateOcidSheet to return duplicateDetails in dry-run mode in lib/googleSheets.js
- [ ] T010 [US2] Extend deduplicateCombatPowerSheet to return duplicateDetails with kept record info in dry-run mode in lib/googleSheets.js
- [ ] T011 [US2] Update API response to include detailed duplicate information when dryRun=true in app/api/cron/deduplicate-ocid/route.js

**Checkpoint**: User Story 2 完成 - 預覽模式可正確回報重複統計而不修改數據

---

## Phase 5: User Story 3 - 記錄清理操作日誌 (Priority: P3)

**Goal**: 提供詳細的處理結果統計，包含執行時間、移除數量、錯誤資訊

**Independent Test**: 執行清理後檢查 API 回應中的詳細報告

### Implementation for User Story 3

- [ ] T012 [US3] Add execution time tracking with startTime and executionTimeMs in app/api/cron/deduplicate-ocid/route.js
- [ ] T013 [US3] Implement error isolation - process both sheets independently, aggregate results in app/api/cron/deduplicate-ocid/route.js
- [ ] T014 [US3] Add console logging for operation progress and results in lib/googleSheets.js
- [ ] T015 [US3] Add error details field to response for partial failure scenarios in app/api/cron/deduplicate-ocid/route.js

**Checkpoint**: User Story 3 完成 - 完整的操作日誌和錯誤處理

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup and validation

- [ ] T016 [P] Run quickstart.md validation - 確認實作符合快速指南
- [ ] T017 [P] Code cleanup - 確保符合 ESLint 和 Prettier 規範
- [ ] T018 Run npm run lint and npm run format to validate code style

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories should proceed sequentially in priority order (P1 → P2 → P3)
  - US2 extends US1 functionality (dryRun mode)
  - US3 extends US1+US2 with logging
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Core deduplication
- **User Story 2 (P2)**: Builds on US1 - Adds preview mode functionality
- **User Story 3 (P3)**: Builds on US1+US2 - Adds detailed logging and error handling

### Parallel Opportunities

- T003 and T004 can run in parallel (different methods in same file)
- T016 and T017 can run in parallel (different concerns)

---

## Parallel Example: User Story 1 Methods

```bash
# Launch both deduplication method implementations together:
Task: "Implement deduplicateOcidSheet method in lib/googleSheets.js"
Task: "Implement deduplicateCombatPowerSheet method in lib/googleSheets.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test basic deduplication works
5. Deploy if needed

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Core deduplication works (MVP!)
3. Add User Story 2 → Preview mode available
4. Add User Story 3 → Full logging and error handling
5. Each story adds value without breaking previous stories

---

## Summary

| Phase                 | Tasks     | Focus        |
| --------------------- | --------- | ------------ |
| Phase 1: Setup        | T001      | 驗證專案結構 |
| Phase 2: Foundational | T002      | 建立目錄結構 |
| Phase 3: User Story 1 | T003-T007 | 核心去重功能 |
| Phase 4: User Story 2 | T008-T011 | 預覽模式     |
| Phase 5: User Story 3 | T012-T015 | 詳細日誌     |
| Phase 6: Polish       | T016-T018 | 清理驗證     |

**Total Tasks**: 18  
**Parallel Opportunities**: 4 tasks  
**MVP Scope**: Phase 1-3 (Tasks T001-T007)
