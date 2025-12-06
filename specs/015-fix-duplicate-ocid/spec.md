# Feature Specification: 修復 Google Sheet 重複 OCID 問題

**Feature Branch**: `015-fix-duplicate-ocid`  
**Created**: 2025-12-07  
**Status**: Draft  
**Input**: User description: "調查 Google Sheet 中重複的 OCID 問題，包括 middleware 運作異常調查，以及建立 cron API 來修正兩個工作表中的重複數據"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 定期清理重複 OCID 數據 (Priority: P1)

作為系統管理員，我希望有一個可由外部排程系統呼叫的 API，能夠自動偵測並移除 Google Sheet 中的重複 OCID 記錄，以確保數據的唯一性和正確性。

**Why this priority**: 這是核心功能，直接解決重複數據問題，確保系統數據完整性。

**Independent Test**: 可透過直接呼叫 API 端點並檢查 Google Sheet 中重複記錄是否被移除來獨立測試。

**Acceptance Scenarios**:

1. **Given** OCID 工作表中存在多筆相同的 OCID 記錄, **When** 呼叫去重 API, **Then** 系統僅保留每個 OCID 的第一筆記錄，移除其餘重複項
2. **Given** CombatPower 工作表中存在多筆相同 OCID 的戰力記錄, **When** 呼叫去重 API, **Then** 系統保留每個 OCID 最新更新時間的記錄，移除其餘重複項
3. **Given** 未授權的請求, **When** 呼叫去重 API, **Then** 系統回傳 401 未授權錯誤
4. **Given** 兩個工作表均無重複數據, **When** 呼叫去重 API, **Then** 系統回傳成功並顯示移除數量為 0

---

### User Story 2 - 取得重複數據統計報告 (Priority: P2)

作為系統管理員，我希望能在執行清理前先查看重複數據的統計資訊，以便了解問題的嚴重程度。

**Why this priority**: 提供透明度，讓管理員能在清理前評估影響範圍。

**Independent Test**: 可透過 API 查詢模式取得統計資料而不執行任何修改操作。

**Acceptance Scenarios**:

1. **Given** OCID 工作表存在重複記錄, **When** 以預覽模式呼叫 API, **Then** 系統回傳重複 OCID 列表及各 OCID 重複次數，但不執行任何修改
2. **Given** CombatPower 工作表存在重複記錄, **When** 以預覽模式呼叫 API, **Then** 系統回傳受影響記錄的統計數據

---

### User Story 3 - 記錄清理操作日誌 (Priority: P3)

作為系統管理員，我希望每次清理操作都有詳細的日誌記錄，以便後續追蹤和稽核。

**Why this priority**: 支援問題調查和合規需求，但不是核心清理功能。

**Independent Test**: 執行清理後檢查 API 回應中的詳細報告資訊。

**Acceptance Scenarios**:

1. **Given** 執行去重操作, **When** 操作完成, **Then** 系統在回應中包含處理時間、各工作表移除數量、以及錯誤資訊（如有）
2. **Given** 清理過程發生錯誤, **When** 某個工作表處理失敗, **Then** 系統記錄錯誤但繼續處理其他工作表，最終回報部分成功狀態

---

### Edge Cases

- 當工作表不存在時，系統應優雅處理而非報錯
- 當工作表為空或僅有標題列時，系統應正常回傳成功
- 當 Google Sheets API 配額耗盡時，系統應回傳適當的錯誤訊息
- 當處理大量數據（超過 1000 筆）時，系統應能在合理時間內完成處理
- 當 OCID 欄位為空白或無效格式時，系統應跳過該記錄

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 系統 MUST 提供一個 API 端點（位於 api/cron 路徑下）來處理重複 OCID
- **FR-002**: 系統 MUST 要求 Authorization header 包含有效的 Bearer token 才能執行操作
- **FR-003**: 系統 MUST 處理 OCID 主工作表（第一個工作表的 A 欄），移除重複的 OCID 記錄
- **FR-004**: 系統 MUST 處理 CombatPower 工作表，移除重複的 OCID 記錄並保留最新更新時間的記錄
- **FR-005**: 系統 MUST 支援預覽模式（dry-run），在不修改數據的情況下回報重複統計
- **FR-006**: 系統 MUST 在回應中包含詳細的處理結果統計
- **FR-007**: 系統 MUST 支援 GET 請求方法以符合現有 cron API 慣例
- **FR-008**: 系統 MUST 在處理大量數據時避免超過執行環境的時間限制

### Key Entities

- **OCID 記錄**: 儲存於 OCID 工作表 A 欄的角色識別碼，每個 OCID 應唯一
- **CombatPower 記錄**: 包含 ocid、combat_power、updated_at、status 欄位的戰力記錄，每個 OCID 應只有一筆最新記錄

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 執行去重操作後，OCID 工作表中不存在任何重複的 OCID 值
- **SC-002**: 執行去重操作後，CombatPower 工作表中每個 OCID 僅存在一筆記錄
- **SC-003**: API 回應包含清楚的處理統計（移除數量、處理時間、錯誤數）
- **SC-004**: 預覽模式能正確回報重複數據而不修改任何記錄
- **SC-005**: 單次 API 呼叫能在合理執行時間內完成處理

## Assumptions

- OCID 工作表使用第一個工作表的 A 欄儲存 OCID 值
- CombatPower 工作表結構為：A 欄 ocid、B 欄 combat_power、C 欄 updated_at、D 欄 status
- 保留策略：OCID 工作表保留第一筆出現的記錄；CombatPower 工作表保留 updated_at 最新的記錄
- API 將透過外部排程系統定期呼叫
- 現有的 CRON_SECRET 環境變數用於驗證
