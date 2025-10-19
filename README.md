# MapleStory 遊戲內容儀表板

一個現代化的響應式網頁應用程式，用於追蹤 MapleStory 角色進度和遊戲內容。使用 Next.js 14、React 18 和 Tailwind CSS 建置。

## 功能特色

- **角色搜尋**：依名稱搜尋 MapleStory 角色
- **角色詳細資料**：查看角色裝備和能力值
- **裝備對話框**：以網格佈局查看角色裝備
- **能力值卡片**：顯示角色統計資料
- **進度追蹤**：查看詳細的角色統計資料和經驗值進度
- **聯盟戰地資訊**：顯示角色的聯盟戰地階級、等級和神器等級
- **六轉矩陣進度**：追蹤六轉矩陣核心進度和屬性資訊
- **符文系統**：查看角色符文配置和效果
- **響應式設計**：針對手機、平板和桌面裝置進行優化
- **無障礙支援**：完整的螢幕閱讀器支援和語意化 HTML
- **效能優化**：記憶化、延遲載入和有效率的重新渲染
- **即時資料**：與 Nexon MapleStory OpenAPI 整合

## 技術棧

- **前端**：Next.js 14 (App Router)、React 18
- **樣式**：Material-UI (MUI)
- **測試**：Jest、React Testing Library
- **API 整合**：Axios
- **資料視覺化**：Recharts
- **部署**：Vercel (推薦)

## 系統需求

- Node.js 18.17 或更新版本
- npm 或 yarn
- Nexon MapleStory OpenAPI 金鑰 (生產環境使用)

## 快速開始

### 1. 複製並安裝

```bash
git clone <repository-url>
cd maplestory
npm install
```

### 2. 環境設定

在專案根目錄建立 `.env.local` 檔案：

```env
# Nexon MapleStory OpenAPI 基礎 URL
NEXT_PUBLIC_API_BASE_URL=https://open.api.nexon.com

# Nexon MapleStory OpenAPI 金鑰
API_KEY=your_nexon_api_key_here
```

> **注意**：如果沒有 API 金鑰，應用程式將使用模擬資料進行開發。

### 3. 開發伺服器

```bash
npm run dev
```

在瀏覽器中開啟 [http://localhost:3000](http://localhost:3000)。

### 4. 測試

```bash
npm test
npm run lint
npm run format:check
```

### 5. 程式碼格式化

開發過程中，請記得格式化程式碼：

```bash
# 自動格式化所有檔案
npm run format

# 檢查格式是否正確（CI/CD 使用）
npm run format:check
```

## 使用方式

### 角色儀表板

1. 前往主要儀表板
2. 在搜尋欄位中輸入角色名稱
3. 點擊「搜尋」來獲取角色資料
4. 查看角色統計資料、進度和成就

### 進度追蹤

1. 前往進度儀表板 (`/dashboard-progress`)
2. 搜尋要追蹤的角色
3. 查看詳細的進度圖表和統計資料
4. 監控經驗值在時間上的變化

## 專案結構

```
├── app/                    # Next.js app router 頁面
│   ├── api/               # API 路由
│   │   ├── character/     # 角色相關 API
│   │   │   ├── equipment/ # 裝備 API
│   │   │   ├── hexa-matrix/ # 六轉矩陣 API
│   │   │   └── stats/     # 能力值 API
│   ├── dashboard/         # 角色儀表板頁面
│   └── dashboard-progress/# 進度追蹤頁面
├── components/            # 可重用 React 組件
│   ├── CharacterCard.js   # 角色顯示組件
│   ├── CharacterStats.js  # 角色能力值組件
│   ├── EquipmentDialog.js # 裝備對話框組件
│   ├── HexaMatrixProgress.js # 六轉矩陣進度組件
│   ├── HexaStatTable.js   # 六轉屬性表格組件
│   ├── ProgressChart.js   # 資料視覺化組件
│   ├── runes/             # 符文系統組件
│   └── ErrorMessage.js    # 錯誤處理組件
├── __tests__/             # 測試檔案
├── lib/                   # 工具函數
│   ├── nexonApi.js       # Nexon API 整合
│   ├── hexaMatrixApi.js  # 六轉矩陣 API 整合
│   ├── hexaMatrixUtils.js # 六轉矩陣資料處理
│   ├── equipmentUtils.js  # 裝備資料處理
│   ├── statsUtils.js      # 能力值資料處理
│   └── cache.js           # 快取管理
└── specs/                 # 專案規格
```

## API 整合

應用程式與 Nexon MapleStory OpenAPI 整合：

- **角色搜尋**：`/api/character/search`
- **角色詳細資料**：`/api/characters/{ocid}`
- **角色裝備**：`/api/character/equipment/{ocid}`
- **角色能力值**：`/api/character/stats/{ocid}`
- **六轉矩陣資料**：`/api/character/hexa-matrix/{ocid}`
- **六轉屬性資訊**：`/api/character/hexa-matrix-stat/{ocid}`

API 回應會在本機快取以提升效能。

### API 調節 (Throttling)

為了遵守 API 速率限制，應用程式在開發環境中對所有 API 呼叫實施 0.2 秒延遲：

- **開發環境**：5 請求/秒 (通過 0.2 秒延遲實現)
- **生產環境**：500 請求/秒 (無延遲)

延遲由 `lib/apiInterceptor.js` 中的 Axios 攔截器自動應用。

## 開發指南

### 程式碼風格

- ES2020 JavaScript 語法
- React 函數式組件搭配 hooks
- Material-UI 組件和樣式
- 語意化 HTML 和無障礙標準

### 測試

- 所有組件的單元測試
- API 路由的整合測試
- 包含無障礙測試

### 效能

- React.memo 用於組件記憶化
- useMemo 用於昂貴計算
- 圖片延遲載入
- 有效率的重新渲染模式

## 部署

### Vercel (推薦)

1. 將 GitHub 儲存庫連接到 Vercel
2. 在 Vercel 儀表板中新增環境變數
3. 推送至主分支時自動部署

### 手動部署

```bash
npm run build
npm start
```

## 貢獻

1. 遵循既定的程式碼風格和測試模式
2. 為新功能新增測試
3. 確保無障礙相容性
4. 視需要更新文件

## 授權

本專案採用 MIT 授權。

## 致謝

- Nexon Corporation 提供 MapleStory OpenAPI
- 資料由 MapleStory OpenAPI 服務提供
