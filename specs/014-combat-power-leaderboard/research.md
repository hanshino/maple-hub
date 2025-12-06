# Research: 戰力排行榜頁面

**Feature**: 014-combat-power-leaderboard  
**Date**: 2025-12-06

## Research Tasks

### 1. 角色基本資訊來源

**問題**: 如何透過 OCID 取得角色基本資訊（icon、名稱、等級、伺服器）？

**發現**:

- 現有 `getCharacterStats` API (`lib/nexonApi.js`) 呼叫 `/character/stat` 端點
- 回傳資料包含 `character_name`、`character_level`、`character_class`、`world_name`、`character_image`
- 可直接複用此 API，但需注意 Nexon API 的呼叫限制

**決策**: 複用現有的 `getCharacterStats` API 來取得角色基本資訊  
**理由**: 已經有完整的實作，包含錯誤處理和快取機制  
**替代方案**:

- 建立新的角色基本資訊 API（額外工作量，無明顯優勢）
- 在 Google Sheet 中額外儲存角色基本資訊（增加資料同步複雜度）

---

### 2. CombatPower 工作表資料結構

**問題**: 現有 CombatPower 工作表的資料結構為何？

**發現**:

- 欄位: `ocid`, `combat_power`, `updated_at`, `status`
- 現有方法 `getExistingCombatPowerRecords()` 可取得所有戰力記錄
- 資料已儲存為字串格式，需轉換為數值進行排序

**決策**: 新增 `getLeaderboardData(offset, limit)` 方法於 `GoogleSheetsClient`  
**理由**: 伺服器端排序和分頁可減少資料傳輸量，符合 Vercel 10 秒限制  
**替代方案**:

- 前端排序（大量資料時效能差）
- 一次載入所有資料（記憶體問題、超時風險）

---

### 3. 無限滾動實作方式

**問題**: React 中如何實作無限滾動？

**發現**:

- 使用 Intersection Observer API 偵測滾動到底部
- Material-UI 沒有內建無限滾動元件，需自行實作
- 需要防抖處理避免重複請求

**決策**: 使用原生 Intersection Observer + React useEffect hook  
**理由**: 輕量、無額外依賴、效能佳  
**替代方案**:

- react-infinite-scroll-component（額外依賴）
- react-virtualized（複雜度過高）
- scroll event + throttle（效能較差）

---

### 4. Nexon API 批量呼叫策略

**問題**: 如何在 Vercel 10 秒限制內批量查詢角色資訊？

**發現**:

- 現有專案使用 300ms API 延遲（`lib/combatPowerService.js`）
- 10 秒內最多可呼叫約 30 次 API
- 每批 20 筆資料，需要 20 次 API 呼叫，約需 6 秒

**決策**:

1. 伺服器端先從 Google Sheet 取得已排序的 OCID+戰力清單
2. 客戶端收到清單後，逐步呼叫 Nexon API 取得角色詳細資訊
3. 使用漸進式載入：先顯示戰力排名，再填充角色詳情

**理由**: 避免伺服器超時，提供即時回應體驗  
**替代方案**:

- 完全伺服器端處理（超時風險高）
- 預先快取所有角色資訊到 Google Sheet（同步複雜度高）

---

### 5. 排序穩定性

**問題**: 戰力相同時如何確保排序穩定？

**發現**:

- JavaScript Array.sort() 在某些引擎中不保證穩定
- 需要次要排序鍵

**決策**: 使用 `combat_power` (降序) + `ocid` (升序) 作為排序依據  
**理由**: OCID 是唯一識別碼，確保排序穩定  
**替代方案**: 使用角色名稱（但名稱可能重複或含特殊字元）

---

### 6. 伺服器端角色資訊快取策略

**問題**: 多個使用者同時訪問排行榜時，如何避免重複呼叫 Nexon API？角色基本資訊（名稱、等級、圖示）短期內不會改變，如何有效快取？

**發現**:

- 角色名稱、圖示在短期內（數小時甚至數天）不會改變
- 角色等級可能每天變化，但不需要即時更新
- Vercel Serverless 函數是無狀態的，記憶體快取在請求間不共享
- 現有 `lib/cache.js` 使用 in-memory Map，僅在單一請求週期內有效
- Google Sheet 可作為持久化快取層

**快取策略選項分析**:

| 方案                   | 優點                   | 缺點                   | 適用性      |
| ---------------------- | ---------------------- | ---------------------- | ----------- |
| A. Google Sheet 快取   | 持久化、免費、現有整合 | 寫入次數有配額限制     | ✅ 最適合   |
| B. Vercel KV (Redis)   | 高效能、低延遲         | 需付費 (免費額度有限)  | ❌ 成本考量 |
| C. 外部 Redis 服務     | 高效能                 | 需額外設定、可能有成本 | ❌ 複雜度   |
| D. 客戶端 localStorage | 簡單                   | 不跨用戶共享           | ❌ 不符需求 |

**決策**: 使用 Google Sheet 作為角色資訊快取層

**實作方案**:

1. **新增 CharacterInfo 工作表**: 儲存角色基本資訊快取
   - 欄位: `ocid`, `character_name`, `character_level`, `character_image`, `world_name`, `character_class`, `cached_at`
2. **快取讀取流程**:

   ```
   排行榜 API 請求
         ↓
   從 CombatPower 取得 OCID 列表
         ↓
   從 CharacterInfo 批量查詢已快取的角色資訊
         ↓
   回傳完整的排行榜資料（包含角色詳情）
   ```

3. **快取更新流程（背景任務）**:

   ```
   定時 CRON 任務 (每 6 小時)
         ↓
   取得所有 OCID
         ↓
   逐一呼叫 Nexon API（300ms 延遲）
         ↓
   批量更新 CharacterInfo 工作表
   ```

4. **快取有效期**: 6 小時（可調整）
   - 若快取過期但 CRON 尚未更新，仍使用舊快取（避免阻塞使用者）

**理由**:

- 符合 XIV. Zero-Cost External Services 原則
- 複用現有 Google Sheets 整合
- 背景更新避免使用者等待
- 多用戶共享同一份快取

**替代方案被拒絕原因**:

- Vercel KV: Hobby 方案免費額度有限 (30K requests/month)
- 客戶端快取: 無法跨用戶共享，每個新用戶仍需呼叫 API

---

## 技術風險評估

| 風險                  | 影響 | 緩解措施                             |
| --------------------- | ---- | ------------------------------------ |
| Nexon API 呼叫限制    | 中   | 伺服器端 Google Sheet 快取、背景更新 |
| Vercel 10 秒超時      | 高   | 快取層避免即時 API 呼叫              |
| 大量資料效能          | 中   | 分頁載入、虛擬滾動（未來優化）       |
| Google Sheet API 配額 | 低   | 批量讀取、合理的更新頻率             |
| 快取資料過期          | 低   | 6 小時更新週期、容忍短暫過期         |

## 結論

採用「Google Sheet 快取層 + 背景 CRON 更新」的架構：

1. **CharacterInfo 工作表**: 儲存角色基本資訊（名稱、等級、圖示、伺服器）
2. **排行榜 API**: 一次從 Google Sheet 取得戰力 + 角色資訊，直接回傳完整資料
3. **CRON 任務**: 定期呼叫 Nexon API 更新 CharacterInfo 快取
4. **無限滾動**: 使用 Intersection Observer 實作
