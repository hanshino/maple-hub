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

## 9. 目前進度推算 ＋ 自用／送禮雙路 ＋ 分段精算（本次擴充）

- **日期**：2026-07-11
- **緣由**：使用者實際使用時，真實情境是「我還差 2,092,440 VIP 點才上皇家，還要送禮/消費多少？」現有工具把「整個門檻」除以單一轉換率，假設從 0 開始、又只有送禮一種比率，算不出這個問題。
- **視覺參考**：已核准之更新版 mockup（Artifact `3d3ea85d-…`，label `deficit-input-final`）。
- **核准決策**（與使用者確認）：輸入以「還差點數」為主（遊戲只顯示這個）；同時算「自己消費」與「送禮」兩種成本；跨等級要**分段精算**；商家自用兌換次數用差額 `remainingPts`。

### 9.1 官方資料（唯一真實來源，需附出處註解）

台服「會員神殿」說明頁（beanfun/Gamania 官方，**2026/06/24 V280 版**，查證日 2026/07/11）。轉換率隨目前等級變動，且**自用 ＝ 送禮 × 1.25**：

| 目前等級 | 達成門檻 | 維持門檻 | 自用（點/樂豆） | 送禮（點/樂豆） |
| --- | --- | --- | --- | --- |
| 非VIP／銀牌 | 50,000（銀） | 銀牌官方未列 | 20 | 16 |
| 金牌 | 150,000 | 225,000 | 30 | 24 |
| 鑽石 | 675,000 | 1,000,000 | 40 | 32 |
| 皇家／皇家黑 | 3,675,000 | 5,000,000 | 50 | 40 |

既有的送禮率（16/24/32/40）與所有門檻皆已逐字核對**正確**，不需改；本次**新增自用率**。累積為「最近 100 天」滾動視窗；跨等級區間官方按各段比率**分段計算**。

**比率變動邊界**（用於分段）：150k（→金）、675k（→鑽）、3,675,000（→皇）；50k（銀）不改變比率（銀＝非VIP＝20/16）。

```
BANDS = [
  { lo:0,       hi:150000,   self:20, gift:16, nm:'非VIP／銀牌' },
  { lo:150000,  hi:675000,   self:30, gift:24, nm:'金牌' },
  { lo:675000,  hi:3675000,  self:40, gift:32, nm:'鑽石' },
  { lo:3675000, hi:Infinity, self:50, gift:40, nm:'皇家' },
]
```
以 `// ponytail:` 註記官方 URL 與「2026/06/24 V280」版本字樣，方便日後比對改版。

### 9.2 計算模型（分段）

引擎的 **canonical 輸入是 `currentPts`（目前累積點數）**；UI 負責「還差 ↔ currentPts」換算（見 9.4）。

```
remainingPts   = max(0, targetPts − currentPts)         // 還差多少點
// 逐段：範圍 [currentPts, targetPts] 與每個 BAND 取交集，用該段比率累加樂豆
segment(current, target):
  for band in BANDS:
    lo = max(current, band.lo); hi = min(target, band.hi)
    if hi > lo:
      pts = hi − lo
      leadouSelf += pts / band.self
      leadouGift += pts / band.gift
      parts.push({ nm, pts, self, gift, ldSelf, ldGift })
buyCostSelf    = leadouSelf / denom                     // denom = baseRate × (1+bonusPct/100)
buyCostGift    = leadouGift / denom
// 商家淨成本/滾動模擬沿用「送禮」路徑：requiredLeadou = leadouGift
redemptions    = floor(remainingPts / exPts)            // 用差額（這趟賺到的點才拿去兌換）
leftoverPts    = remainingPts − redemptions × exPts
```

- **向後相容**：`currentPts` 預設 0 時，`segment(0, target)` 會跨全段。**注意**：既有測試「鑽石(32)+皇家(3,675,000) → 114,843.75」的期望值會因分段改為 **125,000**（150000/16 + 525000/24 + 3000000/32）——這是刻意的正確性修正，需一併更新該測試（並改以「single-band 情境」另立一筆保留單段驗證）。
- 混合折數、`mesoPointValue`、「Σ每輪淨損 ＝ netCost」不變式皆沿用 `requiredLeadou`(=leadouGift)，不受影響。

### 9.3 引擎變更（`lib/vipCalculator.js`）

- `LEVELS` → 擴為 `BANDS`（加 `self`、`lo`/`hi`）。保留 `LEVELS`/`TARGET_PRESETS` 匯出以免破壞既有 import；或同步更新使用端。
- `computeVip(inputs)` 加 `currentPts`（預設 0）；內部 `segment()`；回傳新欄位 `remainingPts`、`leadouSelf`、`buyCostSelf`、`leadouGift`、`buyCostGift`、`parts`。既有 `requiredLeadou`/`buyCost` 對應送禮路徑，語意不變。
- 新增匯出純函式 `tierIndexOf(pts)` 與 `segment(current, target)`，可獨立單測。

### 9.4 UI 變更（`app/vip-calculator/page.js`）

- **移除**「目前 VIP 等級」下拉——等級改由 `currentPts` 自動推導並顯示（避免與點數矛盾）。
- **輸入**：目標門檻（既有）＋「距離目標還差 VIP 點數」（主要輸入，留空＝已達標）。`currentPts = max(0, targetPts − deficit)` 於頁面換算後餵給引擎。反推的「目前累積約 X → 等級 Y」即時顯示。
- **結果**：頂部「還差 X 點」hero；**自用／送禮雙欄卡**（各顯示需樂豆＋需儲值，較省者標「最省」＋省多少）；**分段明細表**（跨段時逐段列出、附總計）。
- 階梯列：highlight 推導的目前等級並標「目標」。
- 商家模式：折數/淨成本/兌換（用差額）/滾動模擬沿用，跑在送禮路徑。
- 沿用站台 glassmorphism 與 light/dark；**卡片 padding 從寬**（見同分支先行的 padding 修正 commit），窄螢幕雙欄改單欄。

### 9.5 非目標（YAGNI）

- 不處理 100 天視窗的「維持/降級倒數」模擬——只算「從目前累積衝到目標門檻」的一次性成本。
- 不做「同時輸入 currentPts 與 deficit 雙向連動」；以 deficit 為主、currentPts 反推顯示即可（日後要再加）。
- 皇家黑（前 50 名審核制）無固定點數門檻，不納入 target preset。

### 9.6 測試（新增／調整）

- `segment()`：單段（鑽石內）、跨兩段（金→鑽）、跨全段（0→皇家＝125,000 樂豆 gift）、已達標（parts 空、樂豆 0）。
- `tierIndexOf()`：各邊界值（149999→金前一段、150000→金、675000→鑽、3675000→皇）。
- `computeVip`：`currentPts>0` 差額計算、雙路徑 `leadouSelf`/`leadouGift`、`redemptions` 用 `remainingPts`、`currentPts=0` 向後相容（並更新舊 114,843.75 案為 125,000 或改單段案）。
- 頁面：deficit → currentPts 反推、等級標籤、雙欄與明細表渲染不 crash。

### 9.7 驗收條件

1. 輸入「還差點數」即得「還差 X 點」＋反推目前累積/等級。
2. 自用、送禮兩種需儲值金額並列，數值符合官方分段比率（例：鑽石段差 2,092,440 → 自用 52,311／送禮 65,389 樂豆）。
3. 跨等級時分段明細表逐段正確、加總一致。
4. 既有商家功能（混合折數、遊戲幣回收、滾動模擬、交叉驗證徽章）不回歸。
5. `npm run lint`、`npm test`、`npm run build` 全綠；diff 無 TODO/skip、無動到無關檔案。
