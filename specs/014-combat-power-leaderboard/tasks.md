# Tasks: 戰力排行榜頁面

**Input**: Design documents from `/specs/014-combat-power-leaderboard/`  
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: 不包含測試任務（未明確要求）

**Organization**: 任務依 User Story 分組，以支援獨立實作和測試

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 可平行執行（不同檔案、無相依性）
- **[Story]**: 所屬 User Story（US1、US2、US3）
- 描述中包含確切檔案路徑

## Path Conventions

專案結構（Next.js App Router）:

- 頁面: `app/`
- API 路由: `app/api/`
- 元件: `components/`
- 服務: `lib/`
- 測試: `__tests__/`

---

## Phase 1: Setup (共用基礎設施)

**Purpose**: Google Sheet CharacterInfo 工作表設置、服務層擴展

- [x] T001 在 `lib/googleSheets.js` 新增 `getOrCreateCharacterInfoSheet()` 方法，建立 CharacterInfo 工作表及標題列
- [x] T002 [P] 在 `lib/googleSheets.js` 新增 `getCharacterInfoCache(ocids)` 方法，批量讀取角色資訊快取
- [x] T003 [P] 在 `lib/googleSheets.js` 新增 `upsertCharacterInfoCache(records)` 方法，更新或插入角色資訊快取
- [x] T004 [P] 在 `lib/googleSheets.js` 新增 `getLeaderboardData(offset, limit)` 方法，取得排序後的戰力排行榜資料

**Checkpoint**: Google Sheet 服務層擴展完成

---

## Phase 2: Foundational (阻塞性前置作業)

**Purpose**: 角色資訊快取服務和 CRON API（所有 User Story 的共用基礎）

**⚠️ CRITICAL**: US1 的完整功能依賴此階段完成

- [x] T005 建立 `lib/characterInfoService.js`，實作 `fetchCharacterInfo(ocid)` 呼叫 Nexon API 取得角色資訊
- [x] T006 在 `lib/characterInfoService.js` 新增 `updateAllCharacterInfoCache()` 方法，批量更新所有角色快取
- [x] T007 建立 `app/api/cron/update-character-info/route.js`，實作 CRON API 端點（含 CRON_SECRET 驗證）

**Checkpoint**: 快取服務和 CRON API 就緒，可開始實作 User Story

---

## Phase 3: User Story 1 - 瀏覽戰力排行榜 (Priority: P1) 🎯 MVP

**Goal**: 使用者可以查看依戰力排序的角色排行榜，顯示排名、icon、名稱、等級、伺服器、戰力

**Independent Test**: 訪問 `/leaderboard` 頁面，確認顯示排行榜列表（首頁 20 筆）

### Implementation for User Story 1

- [x] T008 [US1] 建立 `app/api/leaderboard/route.js`，實作 GET API（合併 CombatPower + CharacterInfo 資料）
- [x] T009 [P] [US1] 建立 `components/LeaderboardCard.js`，實作單一排行項目卡片元件（顯示排名、icon、名稱、等級、伺服器、戰力）
- [x] T010 [US1] 建立 `components/LeaderboardList.js`，實作排行榜列表元件（呼叫 API、顯示列表、處理空狀態和錯誤狀態）
- [x] T011 [US1] 建立 `app/leaderboard/page.js`，實作排行榜頁面（使用 LeaderboardList 元件）

**Checkpoint**: User Story 1 完成 - 可訪問排行榜頁面並查看前 20 名角色

---

## Phase 4: User Story 2 - 無限滾動載入更多資料 (Priority: P2)

**Goal**: 使用者可以向下滾動自動載入更多角色資料

**Independent Test**: 滾動到頁面底部，確認自動載入下一批資料並附加到列表

### Implementation for User Story 2

- [x] T012 [US2] 在 `components/LeaderboardList.js` 新增 Intersection Observer 無限滾動邏輯
- [x] T013 [US2] 在 `components/LeaderboardList.js` 新增載入指示器（CircularProgress）和防抖處理
- [x] T014 [US2] 在 `components/LeaderboardList.js` 新增「已載入 X / Y 筆」計數顯示
- [x] T015 [US2] 在 `components/LeaderboardList.js` 新增「已載入全部資料」提示和載入失敗重試按鈕

**Checkpoint**: User Story 2 完成 - 可無限滾動載入所有角色資料

---

## Phase 5: User Story 3 - 從導覽列進入排行榜 (Priority: P3)

**Goal**: 使用者可以從網站導覽列快速進入排行榜頁面

**Independent Test**: 點擊導覽列「排行榜」連結，確認跳轉到排行榜頁面

### Implementation for User Story 3

- [x] T016 [US3] 修改 `components/Navigation.js`，在導覽列新增「排行榜」連結

**Checkpoint**: User Story 3 完成 - 導覽列顯示排行榜入口

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 跨 User Story 的改進和驗證

- [x] T017 [P] 在 `components/LeaderboardCard.js` 新增預設圖示處理（角色缺少 icon 時）
- [x] T018 [P] 在 `components/LeaderboardList.js` 新增空狀態友善訊息（無資料時）
- [x] T019 執行 `npm run lint` 和 `npm run format` 確保程式碼品質
- [ ] T020 執行 quickstart.md 驗證流程，確認所有功能正常運作

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup
    │
    ▼
Phase 2: Foundational ──────────────────────────┐
    │                                           │
    ▼                                           ▼
Phase 3: US1 (MVP) ──▶ Phase 4: US2 ──▶ Phase 5: US3
    │                       │                   │
    └───────────────────────┴───────────────────┘
                            │
                            ▼
                    Phase 6: Polish
```

### User Story Dependencies

- **User Story 1 (P1)**: 依賴 Phase 2 完成 - 無其他 Story 相依
- **User Story 2 (P2)**: 依賴 Phase 3 (US1) - 擴展 LeaderboardList 元件
- **User Story 3 (P3)**: 依賴 Phase 2 完成 - 可與 US1/US2 平行開發

### Within Each Phase

- T001 必須先完成，T002-T004 可平行
- T005-T006 依序執行，T007 可在 T006 完成後執行
- T008 完成後，T009-T011 可開始
- T012-T015 依序執行（均修改同一檔案）

### Parallel Opportunities

```bash
# Phase 1 平行任務:
T002, T003, T004 (在 T001 完成後)

# Phase 3 平行任務:
T009 (LeaderboardCard) 可與 T008 (API) 平行開發

# Phase 6 平行任務:
T017, T018 可平行執行
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 Phase 1: Setup (T001-T004)
2. 完成 Phase 2: Foundational (T005-T007)
3. 完成 Phase 3: User Story 1 (T008-T011)
4. **驗證點**: 訪問 `/leaderboard` 確認顯示排行榜
5. 可部署 MVP

### Incremental Delivery

1. Setup + Foundational → 基礎就緒
2. 新增 User Story 1 → 測試 → 部署 (MVP!)
3. 新增 User Story 2 → 測試 → 部署（無限滾動）
4. 新增 User Story 3 → 測試 → 部署（導覽整合）
5. 完成 Polish → 最終驗證

### CRON 服務設定

部署後需設定外部 CRON 服務（如 cron-job.org）:

| 設定項   | 值                                                              |
| -------- | --------------------------------------------------------------- |
| URL      | `https://your-domain.vercel.app/api/cron/update-character-info` |
| Method   | POST                                                            |
| Header   | `Authorization: Bearer {CRON_SECRET}`                           |
| Schedule | 每 6 小時 (`0 */6 * * *`)                                       |

---

## Task Summary

| Phase                 | 任務數 | 說明                     |
| --------------------- | ------ | ------------------------ |
| Phase 1: Setup        | 4      | Google Sheet 服務層擴展  |
| Phase 2: Foundational | 3      | 快取服務 + CRON API      |
| Phase 3: US1 (MVP)    | 4      | 排行榜 API + 頁面 + 元件 |
| Phase 4: US2          | 4      | 無限滾動功能             |
| Phase 5: US3          | 1      | 導覽列整合               |
| Phase 6: Polish       | 4      | 跨功能改進               |
| **Total**             | **20** |                          |

---

## Notes

- [P] 任務可平行執行（不同檔案、無相依性）
- [Story] 標籤對應具體 User Story
- 每個 User Story 應可獨立完成和測試
- 完成每個任務或邏輯群組後進行 commit
- 在任何 Checkpoint 可暫停驗證功能
- 避免：模糊任務、同檔案衝突、破壞獨立性的跨 Story 相依
