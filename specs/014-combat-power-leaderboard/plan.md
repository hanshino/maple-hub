# Implementation Plan: 戰力排行榜頁面

**Branch**: `014-combat-power-leaderboard` | **Date**: 2025-12-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-combat-power-leaderboard/spec.md`

## Summary

新增戰力排行榜頁面，從 Google Sheet CombatPower 工作表讀取角色戰力資料，依戰力由高到低排序顯示，支援無限滾動瀏覽。採用伺服器端排序 + 客戶端漸進載入的混合架構，以符合 Vercel 10 秒超時限制。

## Technical Context

**Language/Version**: JavaScript ES2020+  
**Primary Dependencies**: Next.js 15, React 19, Material-UI 7, Axios  
**Storage**: Google Sheets API (CombatPower 工作表)  
**Testing**: Jest 30  
**Target Platform**: Vercel (Hobby Plan)
**Project Type**: Web application (Next.js full-stack)  
**Performance Goals**: 首次載入 < 3 秒, 滾動載入 < 1 秒  
**Constraints**: Vercel 10 秒 API 超時, Nexon API 300ms 呼叫延遲  
**Scale/Scope**: 預估 100-500 筆角色戰力記錄

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| 原則                                | 狀態    | 說明                                           |
| ----------------------------------- | ------- | ---------------------------------------------- |
| I. User-Centric Design              | ✅ PASS | 無限滾動提供流暢體驗，響應式設計               |
| II. API Integration Excellence      | ✅ PASS | 使用現有快取策略，伺服器端 API 路由            |
| III. Component Reusability          | ✅ PASS | 使用 Material-UI，新增可複用的 LeaderboardCard |
| IV. Comprehensive Testing           | ✅ PASS | 將為新元件和 API 撰寫測試                      |
| V. Data Visualization               | ✅ PASS | 清晰的排名資訊呈現                             |
| VI. Performance & Optimization      | ✅ PASS | 分批載入、漸進式渲染                           |
| VII. Simplicity & Maintainability   | ✅ PASS | 複用現有架構，最小化新增複雜度                 |
| VIII. API Security and Architecture | ✅ PASS | API 路由在伺服器端，前端不直接呼叫外部 API     |
| X. MUI Component Maximization       | ✅ PASS | 使用 MUI List、Avatar、CircularProgress 等     |
| XII. Minimalist Implementation      | ✅ PASS | 無過度抽象，直接實作需求                       |
| XIII. Vercel Platform Constraints   | ✅ PASS | API 設計符合 10 秒限制，客戶端處理角色詳情     |
| XIV. Zero-Cost External Services    | ✅ PASS | 使用免費 Google Sheets API                     |

## Project Structure

### Documentation (this feature)

```text
specs/014-combat-power-leaderboard/
├── plan.md              # 本檔案
├── research.md          # Phase 0 研究結果
├── data-model.md        # Phase 1 資料模型
├── quickstart.md        # Phase 1 快速入門
├── contracts/           # Phase 1 API 合約
│   └── leaderboard-api.yaml
└── tasks.md             # Phase 2 任務清單 (由 /speckit.tasks 建立)
```

### Source Code (新增/修改檔案)

```text
app/
├── leaderboard/
│   └── page.js              # [新增] 排行榜頁面
└── api/
    ├── leaderboard/
    │   └── route.js         # [新增] 排行榜 API
    └── cron/
        └── update-character-info/
            └── route.js     # [新增] 角色資訊快取更新 CRON API

components/
├── LeaderboardCard.js       # [新增] 排行榜項目卡片
├── LeaderboardList.js       # [新增] 排行榜列表 (含無限滾動)
└── Navigation.js            # [修改] 新增排行榜連結

lib/
├── googleSheets.js          # [修改] 新增 getLeaderboardData,
│                            #        getCharacterInfoCache,
│                            #        upsertCharacterInfoCache 方法
└── characterInfoService.js  # [新增] 角色資訊快取服務

__tests__/
├── api/
│   ├── leaderboard.test.js              # [新增] 排行榜 API 測試
│   └── cron/
│       └── updateCharacterInfo.test.js  # [新增] CRON API 測試
├── components/
│   ├── LeaderboardCard.test.js          # [新增] 元件測試
│   └── LeaderboardList.test.js          # [新增] 元件測試
└── lib/
    ├── googleSheets.leaderboard.test.js # [新增] 服務測試
    └── characterInfoService.test.js     # [新增] 快取服務測試
```

### Google Sheet 工作表

```text
Spreadsheet
├── [現有] Sheet1 (OCID 列表)
├── [現有] CombatPower (戰力記錄)
└── [新增] CharacterInfo (角色資訊快取)
    欄位: ocid, character_name, character_level,
          character_image, world_name, character_class, cached_at
```

**Structure Decision**:

- 遵循現有 Next.js App Router 架構
- 新增 CharacterInfo 工作表作為角色資訊快取層
- 新增 CRON API 端點供外部排程服務觸發更新
- 排行榜頁面直接從快取讀取，無需即時呼叫 Nexon API

## Complexity Tracking

> 無憲法違規，不需要記錄

_所有設計決策均符合 MapleStory Constitution v3.0.0_
