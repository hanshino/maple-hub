# Research: 修復 Google Sheet 重複 OCID 問題

**Feature**: 015-fix-duplicate-ocid  
**Date**: 2025-12-07  
**Status**: Complete

## Research Tasks

### 1. Google Sheets API - 刪除行操作的最佳實踐

**Task**: 研究如何透過 Google Sheets API 刪除特定行

**Decision**: 使用 `batchUpdate` 搭配 `DeleteDimensionRequest` 來刪除行

**Rationale**:

- Google Sheets API 不提供直接 "刪除行" 的簡單方法
- `spreadsheets.values.clear` 只能清除內容，不能刪除行
- `DeleteDimensionRequest` 可批次刪除多行，效能較佳
- 刪除時需從後往前刪除（高索引到低索引），避免索引位移問題

**Alternatives considered**:

- 逐行刪除：效率低，API 配額消耗大
- 清除內容後排序：複雜且可能破壞其他數據
- 重寫整個工作表：對大型資料集效率低

**Implementation pattern**:

```javascript
// 收集要刪除的行索引（0-based）
const rowsToDelete = [5, 10, 15]; // 需從大到小排序

// 從後往前刪除避免索引位移
rowsToDelete.sort((a, b) => b - a);

const requests = rowsToDelete.map(rowIndex => ({
  deleteDimension: {
    range: {
      sheetId: sheetId,
      dimension: 'ROWS',
      startIndex: rowIndex,
      endIndex: rowIndex + 1,
    },
  },
}));

await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  resource: { requests },
});
```

---

### 2. 現有程式碼 - OCID 重複可能原因分析

**Task**: 分析 middleware 和 sync 機制可能導致重複的原因

**Findings**:

1. **Race Condition in `ocidLogger.logOcid`**:
   - `ocidLogger.logOcid` 檢查 `ocidExists` 後才加入 Set
   - 多個並行請求可能同時通過 `ocidExists` 檢查
   - 導致同一 OCID 被多次加入待同步列表

2. **Cache 過期問題**:
   - `GoogleSheetsClient.ocidCache` 有 5 分鐘過期時間
   - 過期後重新查詢，但查詢到同步之間有時間差
   - 可能導致已存在的 OCID 被誤判為不存在

3. **`appendOcids` 無去重機制**:
   - `sync-ocids` API 直接呼叫 `appendOcids`
   - `appendOcids` 只是 append，不檢查是否已存在
   - 如果 cache 失效，同一 OCID 可能被重複 append

4. **Serverless 冷啟動**:
   - Vercel serverless 函數每次可能是新實例
   - 記憶體中的 `ocidCache` 和 `ocidLogger.ocids` Set 會遺失
   - 導致重複檢查機制失效

**Decision**: 建立去重 API 作為資料修復機制，而非嘗試完美防止重複（防止重複需要分散式鎖定，超出 Hobby 方案能力）

---

### 3. CombatPower 工作表 - 保留最新記錄策略

**Task**: 研究如何判斷 CombatPower 記錄的新舊

**Decision**: 使用 `updated_at` 欄位（ISO 8601 格式）進行比較，保留最新的記錄

**Rationale**:

- 現有 CombatPower 記錄結構：`ocid, combat_power, updated_at, status`
- `updated_at` 是 ISO 8601 格式字串，可直接字串比較
- 選擇最新記錄確保保留最近的戰力數據

**Implementation pattern**:

```javascript
// 按 OCID 分組
const ocidGroups = new Map();
for (const [index, row] of rows.entries()) {
  const [ocid, combat_power, updated_at, status] = row;
  if (!ocidGroups.has(ocid)) {
    ocidGroups.set(ocid, []);
  }
  ocidGroups.get(ocid).push({ index, ocid, combat_power, updated_at, status });
}

// 找出要刪除的行（保留最新的）
const rowsToDelete = [];
for (const [ocid, records] of ocidGroups) {
  if (records.length > 1) {
    // 按 updated_at 降序排列
    records.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    // 保留第一個（最新），其餘刪除
    for (let i = 1; i < records.length; i++) {
      rowsToDelete.push(records[i].index);
    }
  }
}
```

---

### 4. API 效能優化 - 10 秒限制內處理大量數據

**Task**: 研究如何在 Vercel 10 秒限制內完成去重操作

**Decision**: 批次讀取 + 記憶體處理 + 批次刪除

**Rationale**:

- Google Sheets API 讀取整個欄位很快（單次 API 呼叫）
- 在記憶體中進行重複檢測（O(n) 時間複雜度）
- 批次刪除減少 API 呼叫次數

**Performance estimates**:

- 讀取 1000 行：~200-500ms
- 記憶體處理：~10ms
- 批次刪除 100 行：~500-1000ms
- 預估總時間：<3 秒（充裕的安全邊際）

**Fallback strategy**:

- 如果數據量過大，可在回應中提供 `hasMore` 標記
- 外部排程系統可多次呼叫直到完成

---

### 5. 預覽模式實作

**Task**: 研究預覽模式（dry-run）最佳實踐

**Decision**: 使用 query parameter `dryRun=true` 控制

**Rationale**:

- 符合 RESTful 慣例
- 簡單直觀，易於測試
- 現有 cron API 使用類似的 query parameter 模式

**Response structure for dry-run**:

```json
{
  "success": true,
  "dryRun": true,
  "ocidSheet": {
    "duplicatesFound": 15,
    "duplicateOcids": ["ocid1", "ocid2", ...],
    "wouldRemove": 15
  },
  "combatPowerSheet": {
    "duplicatesFound": 8,
    "duplicateOcids": ["ocid3", "ocid4", ...],
    "wouldRemove": 8
  }
}
```

---

## Summary

所有研究任務已完成，無需進一步釐清。技術方案已確定：

1. 使用 `DeleteDimensionRequest` 批次刪除行
2. 從高索引到低索引刪除避免位移問題
3. OCID 工作表保留第一筆；CombatPower 保留最新 `updated_at`
4. 支援 `dryRun` query parameter 進行預覽
5. 預估執行時間 <3 秒，符合 Vercel 10 秒限制
