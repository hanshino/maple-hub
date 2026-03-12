# 設計文件：屬性平衡六角圖 (StatBalanceChart)

**日期**: 2026-03-06
**功能**: 在主頁面顯示角色六維屬性平衡雷達圖，協助玩家判斷投資方向

---

## 一、設計目標

玩家搜尋角色後，能立即看到六個關鍵戰力維度的平衡狀況：

- 哪個維度已過度投資（邊際效益低）
- 哪個維度還有明顯提升空間

---

## 二、UI 位置

放在主頁面 `CharacterDataTabs` 上方，作為獨立卡片，角色載入後直接顯示，不需要進入任何分頁。

```
[CharacterCard] [ProgressChart / HexaMatrix]
[StatBalanceChart  ← 新增]
[CharacterDataTabs (能力值 / 聯盟戰地 / ...)]
```

---

## 三、六個軸定義

| 軸          | 顯示名稱  | 資料來源                                                       |
| ----------- | --------- | -------------------------------------------------------------- |
| 主屬性      | 主屬性    | `final_stat` 中 STR/DEX/INT/LUK 最大值                         |
| 攻擊力/魔力 | 攻擊力    | `final_stat` 攻擊力 or 魔法攻擊力                              |
| 攻擊力%     | 攻擊力%   | `extractEquipmentStats(equipmentRawData).percent.attack_power` |
| Boss 傷害   | Boss 傷害 | `final_stat` Boss 攻擊時傷害%                                  |
| 爆擊傷害    | 爆擊傷害  | `final_stat` 爆擊傷害%                                         |
| 無視防禦    | 無視防禦  | `final_stat` 無視防禦%                                         |

**不需要新 API 呼叫**，所有資料在主頁面已有狀態中。

---

## 四、計算方法：換算主屬

參考 KMS 社群「換算主屬 (환산주스탯)」方法，將各軸換算為等效主屬性數值後比較。

### 換算比例（22 星裝備基準）

| 軸          | 換算公式                                                                | 參考來源            |
| ----------- | ----------------------------------------------------------------------- | ------------------- |
| 主屬性      | `main_stat × 1`（直接使用）                                             | 基準                |
| 攻擊力/魔力 | `atk × 4`（1 ATK ≈ 4 fixed stat）                                       | 나모 研究           |
| 攻擊力%     | `(atk_pct / 100) × main_stat`（乘進主屬性提升幅度）                     | 間接貢獻            |
| Boss 傷害   | `boss_pct × 30`（1% boss ≈ 30 fixed stat）                              | 22 星基準           |
| 爆擊傷害    | `crit_pct × 120`（1% crit ≈ 120 fixed stat）                            | 22 星基準           |
| 無視防禦    | `IED_factor × main_stat`，其中 `IED_factor = 1 - (0.5 × (1 - IED/100))` | 標準 Boss def = 50% |

### 平衡計算

```
total_equiv = sum of all 6 axis equiv values
balance_value = total_equiv / 6
each_axis_ratio = axis_equiv / balance_value
```

- **平衡六角形**：六軸皆為 1.0（正六角形）
- **玩家六角形**：每軸的 `axis_equiv / balance_value`
- 玩家軸 > 1.0 → 過度投資
- 玩家軸 < 1.0 → 可提升方向

---

## 五、視覺設計

使用 **Recharts `RadarChart`**（專案已有 Recharts），三層疊加：

1. **外框**：max ratio 1.5 的正六角形，灰色（`#e0e0e0`）
2. **平衡六角形**：ratio = 1.0 的正六角形，橘色虛線（`#f7931e` 50% 透明）
3. **玩家六角形**：實際 ratio，橘色填滿（`#f7931e` 30% 透明 + 橘色邊線）

圖表下方顯示建議文字（最多 2 個方向）：

> 「建議優先提升：**無視防禦**（目前僅達平衡值的 62%）」

載入中顯示 MUI Skeleton。

---

## 六、新增檔案

| 檔案                             | 說明                                         |
| -------------------------------- | -------------------------------------------- |
| `lib/statBalance.js`             | 純函數：換算主屬計算、比例計算、建議文字生成 |
| `components/StatBalanceChart.js` | React 元件：RadarChart 視覺化                |

### Props（StatBalanceChart）

```js
StatBalanceChart({
  statsData, // /character/stat API response（已在主頁面載入）
  equipmentData, // /character/item-equipment API response（equipmentRawData）
  loading, // boolean
});
```

---

## 七、主頁面整合

在 `app/page.js` 的 `HomeContent` 中，在 `<CharacterDataTabs>` 前插入 `<StatBalanceChart>`，傳入已有的 `character`（含 statsData）和 `equipmentRawData`。

---

## 八、測試計畫

- `lib/statBalance.js` 純函數單元測試：換算比例、平衡計算、邊界值（0 值、缺失欄位）
- 元件測試：載入中骨架、正常渲染、全部為 0 的 fallback

---

## 九、已知限制

- 換算比例（ATK×4、boss%×30 等）為 22 星裝備基準，對低星力角色可能偏差
- 攻擊力% 只計算裝備潛能，不含套裝效果、聯盟、內在能力的 % 攻擊（暫不解析）
- 無視防禦假設標準 Boss 防禦率 50%，不針對特定 Boss 調整
