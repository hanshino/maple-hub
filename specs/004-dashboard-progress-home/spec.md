# Feature Specification: Dashboard Progress Home Enhancement

**Feature Branch**: `004-dashboard-progress-home`  
**Created**: 2025-10-18  
**Status**: Draft

## Clarifications

### Session 2025-10-18

- Q: What are the specific data attributes for Alliance Battlefield information? → A: date (nullable), union_level (integer), union_grade (string), union_artifact_level (integer), union_artifact_exp (integer), union_artifact_point (integer)
- Q: Which Alliance Battlefield attributes should be displayed in the character info UI? → A: union_grade (戰地階級), union_level (戰地等級), union_artifact_level (神器等級)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Alliance Battlefield Info (Priority: P1)

用戶可以搜尋角色並查看其聯盟戰地詳細資訊。

**Why this priority**: 這是核心新功能，添加角色資訊內容，提升用戶價值。

**Independent Test**: 可以通過搜尋角色並驗證聯盟戰地資訊顯示來獨立測試。

**Acceptance Scenarios**:

1. **Given** 用戶在 dashboard-progress 頁面，**When** 用戶輸入角色名稱並搜尋，**Then** 系統顯示角色的聯盟戰地詳細資訊，包括戰地階級、戰地等級和神器等級。
2. **Given** 角色有聯盟戰地資料，**When** 用戶查看資訊，**Then** 所有相關統計和細節正確顯示。

---

### User Story 2 - Set Dashboard Progress as Home (Priority: P1)

Dashboard-progress 成為應用程式的首頁，用戶預設看到這個畫面。

**Why this priority**: 改變用戶體驗，讓主要功能更容易訪問。

**Independent Test**: 可以通過訪問根路徑 / 並確認顯示 dashboard-progress 內容來測試。

**Acceptance Scenarios**:

1. **Given** 用戶訪問應用程式根路徑，**When** 頁面載入，**Then** dashboard-progress 內容顯示為首頁。

---

### User Story 3 - Remove Other Pages (Priority: P2)

移除其他頁面，因為目前只有 dashboard-progress 功能。

**Why this priority**: 簡化應用程式，移除不必要的頁面。

**Independent Test**: 可以通過檢查導航和路由確認只有 dashboard-progress 頁面存在來測試。

**Acceptance Scenarios**:

1. **Given** 應用程式運行，**When** 用戶嘗試訪問其他頁面，**Then** 頁面不存在或重定向到 dashboard-progress。

---

### Edge Cases

- 當 Nexon OpenAPI 不可用時，系統應顯示適當的錯誤訊息並提供備用內容。
- 當角色沒有聯盟戰地資料時，系統應顯示"無資料"或適當的訊息。
- 當搜尋無效角色時，系統應處理並顯示錯誤。

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 系統必須從 Nexon OpenAPI 獲取角色的聯盟戰地詳細資訊並顯示。
- **FR-002**: 系統必須將 dashboard-progress 設為首頁 (/ )，用戶預設訪問此頁面。
- **FR-003**: 系統必須移除其他頁面 (如 dashboard)，確保只有 dashboard-progress 功能。

### Key Entities _(include if feature involves data)_

- **角色 (Character)**: 代表 MapleStory 角色，包含基本資訊和聯盟戰地統計。
- **聯盟戰地資訊 (Alliance Battlefield Info)**: 包含 date (nullable), union_level (integer), union_grade (string), union_artifact_level (integer), union_artifact_exp (integer), union_artifact_point (integer)，與角色關聯。

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 用戶可以訪問應用程式首頁並立即看到 dashboard-progress 內容，載入時間少於 3 秒。
- **SC-002**: 90% 的角色搜尋成功顯示聯盟戰地資訊。
- **SC-003**: 應用程式中不再有其他頁面，導航簡化。
