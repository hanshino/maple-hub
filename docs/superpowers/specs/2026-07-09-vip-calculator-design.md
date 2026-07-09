# VIP 儲值試算器 — 設計規格

- **日期**：2026-07-09
- **狀態**：設計已核准（含視覺 mockup），待寫實作規劃
- **來源**：使用者提供的獨立 HTML 工具（`vip_calculator.html`），要接進 maple-hub

## 1. 目的與範圍

在 maple-hub 新增一個 **VIP 儲值試算器** 頁面，協助使用者估算衝到目標 VIP 等級的成本。

雙受眾，用**模式切換**處理：

- **玩家模式（預設）**：只回答「要衝到某 VIP 等級，需要多少樂豆、要儲值多少台幣」。
- **商家 / 代儲模式（進階開關展開）**：額外算折數賣客的淨成本、自用點數兌換，以及分批滾動操作模擬。

**明確不做（YAGNI）**：後端、資料庫、帳號綁定、官方 API 串接、輸入記憶（localStorage 存設定）。全部純前端即時計算。輸入記憶列為之後可加的一個 `useEffect`，非本次範圍。

## 2. 計算模型（實作的唯一真實來源）

所有金額假設 **1 樂豆 ≈ 1 元台幣面值**；`baseRate` 與 `bonusPct` 只影響「買進」側（模擬儲值活動加碼），不影響賣客回收側。此假設須在 UI 上標註。

輸入：`giftRate`(轉換率，點/樂豆)、`targetPts`(目標點數)、`bonusPct`(回饋%)、`baseRate`(匯率，預設 1)、`costCap`(成本上限)、`cash`(現金)、`discount`(折數 0–1，可空)、`exPts`(每次兌換耗點)、`exReward`(每次兌換得遊戲點)、`marketValue`(遊戲點市值)。

```
bonusMult      = 1 + bonusPct / 100
denom          = baseRate * bonusMult              // 每 1 元台幣買到幾樂豆
requiredLeadou = targetPts / giftRate              // 達門檻需送禮的樂豆
buyCost        = requiredLeadou / denom            // 買齊需儲值的台幣（含回饋）
minDiscount    = max(0, (buyCost - costCap) / requiredLeadou)
discountUsed   = (discount 有填) ? discount : minDiscount
netCost        = buyCost - requiredLeadou * discountUsed   // 賣客後的淨成本
redemptions    = floor(targetPts / exPts)
leftoverPts    = targetPts - redemptions * exPts
gamePoints     = redemptions * exReward
redeemValue    = gamePoints * marketValue
effCost        = netCost - redeemValue             // 扣自用點數市值後的實際成本
```

### 滾動操作模擬（修正版）

原始 HTML 的 `soldBack` 三元判斷兩個分支相同（無作用），予以移除。修正後每一輪：

```
一輪：
  needed     = requiredLeadou - accumulated
  investCash = (cash*denom >= needed) ? needed/denom : cash   // 最後一輪只買補足缺口
  若 investCash <= 0 → 中止（現金耗盡、無法前進）
  bought     = investCash * denom
  accumulated += bought
  soldBack   = bought * discountUsed                          // 整批送禮給客人、收折數現金
  cash        = cash - investCash + soldBack
  記錄該輪；roundLoss = investCash - soldBack
重複到 accumulated >= requiredLeadou，或達上限輪數（MAX = 40）
```

**不變式（必測）**：達標時 `Σ roundLoss ≈ netCost`（誤差 < 1 元）。這是修正的驗收依據，UI 上也以徽章顯示兩數相等。

達不到門檻的情況（現金不足、40 輪內未達標、或無法前進）須明確提示，不可靜默截斷。

## 3. 架構與檔案

| 檔案                                          | 內容                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `lib/vipCalculator.js`（新增）                | 純函式 `computeVip(inputs)` + 常數 `LEVELS`、`TARGET_PRESETS`。不含 React，可獨立單測。  |
| `app/vip-calculator/page.js`（新增）          | `'use client'` client component。以 `useMemo` 包 `computeVip`，MUI 呈現。                |
| `components/Navigation.js`（修改）            | `NAV_ITEMS` 加 `{ href:'/vip-calculator', label:'VIP 試算', icon: CalculateOutlined }`。 |
| `app/sitemap.js`（修改）                      | 補 `/vip-calculator` 一筆。                                                              |
| `__tests__/lib/vipCalculator.test.js`（新增） | 單元測試（見 §6）。                                                                      |

**常數維護**：`LEVELS`、`TARGET_PRESETS` 硬編在 `lib/vipCalculator.js` 頂部。官方調整門檻/轉換率時＝改物件、發 PR。以 `// ponytail:` 註記升級路徑（若官方頻繁變動再改讀 config）。

```
LEVELS = [
  { name:'非VIP／銀牌', rate:16, ptsLabel:'50,000 起' },
  { name:'金牌',        rate:24, ptsLabel:'150k／維持225k' },
  { name:'鑽石',        rate:32, ptsLabel:'675k／維持1M' },
  { name:'皇家',        rate:40, ptsLabel:'3.675M／維持5M' },
]
TARGET_PRESETS = [ 150000, 225000, 675000, 1000000, 3675000, 5000000 ] + 自訂
```

## 4. UI / 元件

- 模式切換：MUI `ToggleButtonGroup`（玩家 / 商家），控制進階區塊顯隱。
- 輸入：MUI `TextField`(type=number) 與 `Select`；玻璃卡沿用 `app/about/page.js` 的 `glassCardSx` 風格。
- 頂部 VIP 階梯列：依目前等級 highlight，用 theme 色重畫（參考 mockup）。
- 結果：stat 卡（label + 值）；淨成本、實際成本依是否超 `costCap` 切 `success`/`error` 語意色（與橘色主色分離）。
- 滾動模擬：MUI `Table`，外層 `overflow-x:auto`；下方交叉驗證徽章。
- light/dark：沿用站台 `mode === 'dark'` 三元慣例；橘色主題。
- 響應式：窄螢幕輸入卡與結果卡改單欄。

視覺參考：已核准之 mockup（`scratchpad/vip-calculator-mockup.html` / Artifact）。差異：正式版用 MUI 元件、站台 Nunito 字型、`react-icons` 楓葉。

## 5. 輸入驗證（信任邊界，不省）

- 空值/NaN／負數一律以 0 代入計算（欄位本身可保留使用者輸入字串）。
- 除法保護：`giftRate`（來自 Select 恆 > 0）、`exPts`（≤0 時 `redemptions` 記 0、`leftoverPts` 記 `targetPts`）、`denom`（≤0 時買進成本標「—」）。
- `discount` clamp 到 0–1。
- 空字串折數＝自動採用 `minDiscount`。

## 6. 測試（`__tests__/lib/vipCalculator.test.js`，Jest）

- **已知值**：鑽石(32) + 皇家達成(3,675,000) → `requiredLeadou = 114,843.75`；回饋 5%、匯率 1 → `buyCost ≈ 109,375`。
- **交叉驗證不變式**：多組輸入下 `Σ roundLoss` 與 `netCost` 誤差 < 1 元。
- **邊界**：
  - 預算已足（`buyCost <= costCap`）→ `minDiscount === 0`。
  - 現金極低 → `reached === false`，且回傳的 sim 不進入無限迴圈（受 MAX 與 no-progress 中止保護）。
  - `exPts` 為 0/空 → `redemptions === 0`、`leftoverPts === targetPts`，不丟例外。
- （選配）`page.js` smoke render 測試，確認玩家/商家切換不 crash。

## 7. 驗收條件

1. `/vip-calculator` 可開，導覽列有入口，玩家模式預設。
2. 玩家模式顯示「需要樂豆」「需儲值台幣」；商家模式額外顯示折數/淨成本/自用兌換/實際成本/滾動表。
3. 滾動總淨損與單筆淨成本一致（徽章顯示 ✓），且對應單元測試通過。
4. light/dark、窄螢幕皆正常。
5. `npm run lint`、`npm test`、`npm run build` 全綠；diff 無 TODO/skip、無動到無關檔案。

## 8. 進階回收（混合折數 + 遊戲幣回收）

商家模式的兩項延伸，與同一分支一起實作。核心洞察：兩者都不需要動核心引擎的骨架——混合折數是折數輸入的一般化，遊戲幣回收是 `marketValue` 的推導。

### 8.1 混合折數（分批賣客）

商家把要出的樂豆拆給多個客人、各自不同折數。每筆 `{ face(面額，元/樂豆 1:1), disc(折數倍率 0–1，可 null=未定折) }`。未定折的量（空白列 ＋ 尚未分配的剩餘 `requiredLeadou − Σface`）統一用一個「建議折」推算。

```
pricedRecover    = Σ(faceᵢ × discᵢ)                                  // 已定折的列
autoVolume       = Σ(空白列 face) + max(0, requiredLeadou − Σface)
minDiscount      = clamp((buyCost − costCap − pricedRecover) / autoVolume, 0, 1)  // 剛好卡成本上限
autoDiscountUsed = (autoDiscount 有填) ? clamp(autoDiscount,0,1) : minDiscount
soldRecover      = pricedRecover + autoVolume × autoDiscountUsed
discountUsed     = clamp(soldRecover / requiredLeadou, 0, 1)          // 有效折數（攤到全部需賣量）
netCost          = buyCost − requiredLeadou × discountUsed
```

- **向後相容**：空 `tranches` ＋ 單一 `autoDiscount`（或舊 `discount`）＝ 原本的單一折數行為，既有測試不變。
- 滾動模擬與「Σ 每輪淨損 ＝ netCost」不變式沿用 `discountUsed`，不受影響。
- 折數 UI 以「折」為單位（8＝8折＝×0.8），內部 ÷10 轉倍率；留空＝未定折＝交給系統用建議折推算。

### 8.2 遊戲幣回收（純 UI 推導 marketValue）

VIP 兌換的遊戲點數不能送禮，但可在遊戲內買遊戲幣（Meso）再賣給玩家收現金。兩個行情：① 遊戲內「X 點 = Y 遊戲幣」；② 市場「1 NTD = Z 遊戲幣」。

```
mesoPointValue = (Y / X) / Z    // 元/點；X 或 Z ≤ 0 時回 0
```

頁面把 `mesoPointValue` 當作 `marketValue` 餵進現有引擎（checkbox 關閉＝留自用＝marketValue 0）。引擎的 `redeemValue = gamePoints × marketValue`、`effCost = netCost − redeemValue` 不變。純函式 `mesoPointValue` 抽在 `lib/vipCalculator.js`，可單測。

### 8.3 檔案/測試（本階段實際變更）

- `lib/vipCalculator.js`：`computeVip` 加 `tranches`/`autoDiscount` 與新輸出 `pricedFace/autoVolume/remainder/soldRecover/autoDiscountUsed`；新增 `mesoPointValue`。
- `app/vip-calculator/page.js`：商家模式改用分批列表 ＋ 建議折欄；市值改兩行情 ＋ 開關。
- 測試新增：混合折數卡成本上限、空白列併入、賣超、`autoDiscount` 覆寫、`mesoPointValue` 已知值/除零/接引擎；既有 12 項全數保留。
