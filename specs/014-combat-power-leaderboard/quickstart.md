# Quickstart: 戰力排行榜頁面

**Feature**: 014-combat-power-leaderboard  
**Date**: 2025-12-06

## 概述

新增戰力排行榜頁面，顯示 Google Sheet 上已記錄的角色戰力排名，支援無限滾動瀏覽。

**架構特點**:

- 使用 Google Sheet `CharacterInfo` 工作表作為角色資訊快取層
- 排行榜 API 直接從快取讀取，無需即時呼叫 Nexon API
- 背景 CRON 任務定期更新角色資訊快取

## 快速開始

### 1. 啟動開發環境

```bash
npm run dev
```

### 2. 訪問排行榜頁面

開啟瀏覽器前往: `http://localhost:3000/leaderboard`

### 3. 測試 API

```bash
# 取得排行榜前 20 筆（含角色詳情）
curl "http://localhost:3000/api/leaderboard"

# 取得第 21-40 筆
curl "http://localhost:3000/api/leaderboard?offset=20&limit=20"

# 手動觸發角色資訊快取更新（需 CRON_SECRET）
curl -X POST "http://localhost:3000/api/cron/update-character-info" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 功能檔案結構

```
app/
├── leaderboard/
│   └── page.js                      # 排行榜頁面
├── api/
│   ├── leaderboard/
│   │   └── route.js                 # 排行榜 API
│   └── cron/
│       └── update-character-info/
│           └── route.js             # 角色資訊快取更新 CRON API

components/
├── LeaderboardCard.js               # 排行榜項目卡片
├── LeaderboardList.js               # 排行榜列表 (含無限滾動)
└── Navigation.js                    # 導覽列 (更新)

lib/
├── googleSheets.js                  # 新增快取相關方法
└── characterInfoService.js          # 角色資訊快取服務
```

## 關鍵實作要點

### 1. 角色資訊快取架構

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  CharacterInfo  │────▶│  Leaderboard    │────▶│  Client         │
│  (Google Sheet) │     │  API            │     │  (React)        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲
        │ 每 6 小時更新
┌─────────────────┐     ┌─────────────────┐
│  CRON API       │────▶│  Nexon API      │
│  (背景任務)     │     │  (角色資訊)     │
└─────────────────┘     └─────────────────┘
```

### 2. 無限滾動

使用 Intersection Observer API 偵測滾動到底部，自動載入下一批資料。

```javascript
// 偵測底部元素進入視窗
const observerRef = useRef();
useEffect(() => {
  const observer = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting && hasMore && !isLoading) {
        loadMore();
      }
    },
    { threshold: 0.1 }
  );
  if (observerRef.current) observer.observe(observerRef.current);
  return () => observer.disconnect();
}, [hasMore, isLoading]);
```

### 3. 排行榜 API 回應

API 直接回傳完整資料（含角色詳情），客戶端無需額外請求：

```javascript
// GET /api/leaderboard 回應範例
{
  "entries": [
    {
      "rank": 1,
      "ocid": "abc123",
      "combat_power": 150000000,
      "character_name": "角色名稱",
      "character_level": 285,
      "character_image": "https://...",
      "world_name": "艾麗亞",
      "updated_at": "2025-12-06T10:30:00Z"
    }
  ],
  "totalCount": 50,
  "hasMore": true
}
```

### 4. 防抖處理

避免快速滾動時重複發送請求。

```javascript
const loadMore = useCallback(
  debounce(() => {
    if (!isLoading && hasMore) {
      fetchNextBatch();
    }
  }, 300),
  [isLoading, hasMore]
);
```

## 外部 CRON 服務設定

使用 cron-job.org 或類似服務設定定期任務：

| 設定項   | 值                                                              |
| -------- | --------------------------------------------------------------- |
| URL      | `https://your-domain.vercel.app/api/cron/update-character-info` |
| Method   | POST                                                            |
| Header   | `Authorization: Bearer {CRON_SECRET}`                           |
| Schedule | 每 6 小時 (`0 */6 * * *`)                                       |

## 測試

```bash
# 執行所有測試
npm test

# 執行排行榜相關測試
npm test -- --testPathPattern="leaderboard"
```

## 注意事項

1. **快取策略**: 角色資訊每 6 小時更新，若需更即時可調整 CRON 頻率
2. **首次部署**: 需先手動觸發 CRON API 填充 CharacterInfo 快取
3. **Vercel 限制**: API 需在 10 秒內完成，快取機制確保符合限制
4. **API 速率**: CRON 任務使用 300ms 延遲呼叫 Nexon API
5. **快取**: 角色資訊使用現有快取機制
6. **空狀態**: 無資料時顯示友善訊息
