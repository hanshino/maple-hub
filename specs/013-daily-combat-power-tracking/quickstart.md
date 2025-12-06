# Quickstart: Daily Combat Power Tracking

**Feature**: 013-daily-combat-power-tracking  
**Date**: 2025-12-06

## Prerequisites

- Node.js 18.17+ installed
- Project dependencies installed (`npm install`)
- Environment variables configured (see below)
- Google Sheets API credentials configured
- Nexon OpenAPI key configured

## Environment Variables

確保以下環境變數已設定：

```bash
# 已有的 Google Sheets 設定
GOOGLE_SHEETS_PROJECT_ID=your-project-id
GOOGLE_SHEETS_PRIVATE_KEY_ID=your-key-id
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SHEETS_CLIENT_ID=your-client-id
GOOGLE_SHEETS_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
SPREADSHEET_ID=your-spreadsheet-id

# 已有的 Nexon API 設定
NEXT_PUBLIC_API_BASE_URL=https://open.api.nexon.com/maplestory/v1
API_KEY=your-nexon-api-key

# Cron 認證
CRON_SECRET=your-secure-random-secret
```

## Google Sheet 設定

### 1. 建立 CombatPower 工作表

在現有的 Google Spreadsheet 中新增一個名為 `CombatPower` 的工作表（Sheet）：

1. 開啟您的 Google Spreadsheet
2. 點擊底部的 `+` 按鈕新增工作表
3. 將新工作表命名為 `CombatPower`
4. 在第一行新增標題：
   - A1: `ocid`
   - B1: `combat_power`
   - C1: `updated_at`
   - D1: `status`

## Quick Test

### 1. 本地測試（開發環境）

```bash
# 啟動開發伺服器
npm run dev

# 測試 API 端點（需要正確的 CRON_SECRET）
curl -X GET "http://localhost:3000/api/cron/combat-power-refresh?offset=0&batchSize=5" \
  -H "Authorization: Bearer your-cron-secret"
```

### 2. 預期響應

```json
{
  "success": true,
  "processed": 5,
  "offset": 0,
  "batchSize": 5,
  "nextOffset": 5,
  "totalCount": 100,
  "hasMore": true,
  "stats": {
    "success": 5,
    "failed": 0,
    "notFound": 0
  },
  "executionTimeMs": 1523,
  "timestamp": "2025-12-06T02:00:00.000Z"
}
```

### 3. 執行測試

```bash
# 執行單元測試
npm test -- --testPathPattern="combatPower"

# 執行所有測試
npm test
```

## 外部 Cron 服務設定

### 使用 cron-job.org（推薦）

1. 註冊 [cron-job.org](https://cron-job.org) 帳號
2. 建立新的 Cron Job：
   - **URL**: `https://your-domain.vercel.app/api/cron/combat-power-refresh?offset=0&batchSize=15`
   - **Schedule**: `0 2 * * *` (每天凌晨 2:00)
   - **Request Method**: GET
   - **Headers**:
     - `Authorization: Bearer your-cron-secret`

### 處理大量 OCID

如果 OCID 數量超過 15 個，需要設定多個 Cron Jobs：

```
Job 1: ?offset=0&batchSize=15   (凌晨 2:00)
Job 2: ?offset=15&batchSize=15  (凌晨 2:01)
Job 3: ?offset=30&batchSize=15  (凌晨 2:02)
...
```

或使用響應中的 `nextOffset` 和 `hasMore` 實作自動化鏈式調用。

## Verification

### 檢查 Google Sheet

任務執行後，檢查 `CombatPower` 工作表：

- 每個 OCID 應有對應的戰鬥力數值
- `updated_at` 應為最新的執行時間
- `status` 應為 `success`、`error` 或 `not_found`

### 檢查日誌

在 Vercel Dashboard 或本地終端機查看執行日誌：

```
🚀 Combat power refresh started: offset=0, batchSize=15
📥 Fetched 15 OCIDs from Google Sheets
⚡ Processing OCID: abc123...
✅ Combat power refresh completed: 15 processed (14 success, 0 failed, 1 not_found)
```

## Troubleshooting

| 問題             | 可能原因               | 解決方案                  |
| ---------------- | ---------------------- | ------------------------- |
| 401 Unauthorized | CRON_SECRET 不匹配     | 檢查環境變數和請求 Header |
| 500 Server Error | Google Sheets API 錯誤 | 檢查憑證和 Spreadsheet ID |
| 部分 OCID 失敗   | Nexon API 速率限制     | 減少 batchSize 或增加間隔 |
| 超時錯誤         | 批次太大               | 減少 batchSize 到 10      |
