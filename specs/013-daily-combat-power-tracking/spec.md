# Feature Specification: Daily Combat Power Tracking

**Feature Branch**: `013-daily-combat-power-tracking`  
**Created**: 2025-12-06  
**Status**: Draft  
**Input**: User description: "目前本專案已經蒲集了用戶的 ocid 到 google sheet 中，我需要透過 nexon api 將這些數據在每天一次在凌晨的時候獲取用戶的戰力指數並且紀錄到 google sheet 中"

## Clarifications

### Session 2025-12-06

- Q: 戰鬥力數據應該保留歷史記錄還是每次覆蓋更新？ → A: 覆蓋更新（每個 OCID 僅保留一筆最新數據）

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Daily Automated Combat Power Collection (Priority: P1)

系統管理員希望系統每天凌晨自動從已記錄的 OCID 列表中獲取所有角色的戰鬥力數據，並將這些數據記錄到 Google Sheet 中（覆蓋更新現有記錄），以便後續進行數據分析和排行榜維護。

**Why this priority**: 這是核心功能，自動化的數據收集是整個排行榜和數據分析的基礎。沒有這個功能，就無法進行任何後續的戰力追蹤和排名。

**Independent Test**: 可以透過手動觸發排程任務，驗證系統是否成功從 Nexon API 獲取戰鬥力數據並寫入 Google Sheet。

**Acceptance Scenarios**:

1. **Given** Google Sheet 中已存在多個 OCID 記錄, **When** 系統在凌晨執行排程任務, **Then** 系統成功為每個 OCID 獲取戰鬥力數據並記錄到 Google Sheet 中。
2. **Given** 排程任務執行時, **When** 某個 OCID 的 API 請求失敗, **Then** 系統記錄錯誤並繼續處理剩餘的 OCID，不中斷整體任務。
3. **Given** 某角色已有戰鬥力記錄, **When** 排程任務再次執行, **Then** 系統覆蓋更新該角色的戰鬥力數據和時間戳記，而非新增一筆記錄。

---

### User Story 2 - Task Execution Monitoring (Priority: P2)

系統管理員希望能夠監控排程任務的執行狀況，確保數據收集正常運作。

**Why this priority**: 監控功能有助於及早發現問題，是確保系統穩定運作的重要輔助功能。

**Independent Test**: 可以透過查看執行日誌，確認任務的開始時間、結束時間、處理數量和錯誤數量。

**Acceptance Scenarios**:

1. **Given** 排程任務執行完成, **When** 管理員查看執行記錄, **Then** 可以看到總處理筆數、成功筆數、失敗筆數和執行時間。
2. **Given** 排程任務執行過程中發生錯誤, **When** 查看執行記錄, **Then** 可以看到具體的錯誤訊息和對應的 OCID。

---

### Edge Cases

- 當 Google Sheet 中沒有任何 OCID 記錄時，系統應該優雅地完成任務而不報錯。
- 當 Nexon API 返回速率限制錯誤時，系統應該實施退避策略並重試。
- 當 Google Sheet API 暫時不可用時，系統應該記錄錯誤並在下次排程時重試。
- 當某個 OCID 對應的角色已被刪除或不存在時，系統應該記錄此狀況並繼續處理其他 OCID。
- 當排程任務執行時間過長（例如超過 30 分鐘）時，系統應該考慮分批處理或超時機制。

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 系統必須提供每日定時執行的排程任務，在凌晨時段自動執行戰鬥力數據收集。
- **FR-002**: 系統必須從 Google Sheet 讀取所有已記錄的 OCID 列表。
- **FR-003**: 系統必須透過 Nexon API 為每個 OCID 獲取角色的戰鬥力數據（從 final_stat 中提取 stat_name 為「戰鬥力」的 stat_value）。
- **FR-004**: 系統必須將獲取的戰鬥力數據連同時間戳記記錄到 Google Sheet 中。
- **FR-005**: 系統必須實施 API 速率限制控制，避免超過 Nexon API 的請求限制。
- **FR-006**: 系統必須在單個 OCID 處理失敗時繼續處理其他 OCID，確保整體任務的穩健性。
- **FR-007**: 系統必須記錄每次任務執行的統計資訊（處理數量、成功數量、失敗數量、執行時間）。
- **FR-008**: 系統必須在每次執行時覆蓋更新角色的戰鬥力記錄，每個角色僅保留最新一筆數據。

### Key Entities

- **OCID 記錄**: 代表已收集的角色識別碼，存儲於 Google Sheet 中，作為數據收集的來源。
- **戰鬥力記錄**: 代表角色的最新戰鬥力快照，包含 OCID、戰鬥力數值、最後更新時間（每個 OCID 僅一筆記錄）。
- **任務執行記錄**: 代表每次排程任務的執行狀況，包含開始時間、結束時間、處理統計。

## Assumptions

- 系統已經實作 OCID 收集功能，Google Sheet 中已有 OCID 數據可供使用。
- Nexon API 的戰鬥力數據可透過現有的 `/character/stat` 端點獲取。
- 凌晨時段定義為當地時間 00:00-06:00，具體執行時間由部署平台排程設定決定。
- Google Sheet 的資料量與 OCID 數量成正比（每個 OCID 僅一筆記錄），不會隨時間累積。
- API 速率限制策略沿用現有專案的延遲機制（每次 API 請求間隔適當時間）。

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 系統每日成功執行一次戰鬥力數據收集任務，執行成功率達到 95% 以上。
- **SC-002**: 對於可用的角色，戰鬥力數據獲取成功率達到 98% 以上（排除已刪除或不存在的角色）。
- **SC-003**: 排程任務能在合理時間內完成（處理 1000 個 OCID 應在 60 分鐘內完成）。
- **SC-004**: 單一 OCID 的處理失敗不影響其他 OCID 的處理，系統容錯率 100%。
- **SC-005**: 管理員能夠在任務完成後查看執行統計，確認數據收集狀況。
