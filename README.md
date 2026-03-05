# Maple Hub

查詢你的楓之谷角色，追蹤成長軌跡，和其他玩家一較高下。

## 這是什麼？

Maple Hub 是一個免費的楓之谷角色查詢工具，讓你可以：

- **搜尋角色** — 輸入角色名稱，立即查看裝備、能力值、HEXA 核心等完整資訊
- **追蹤成長** — 記錄角色的歷史數據，用圖表看見自己的進步
- **戰鬥力排行榜** — 看看自己在排行榜上的位置，和其他玩家比較
- **裝備瀏覽** — 完整的裝備資訊顯示，包含卷軸、星力、淺能等細節
- **聯盟戰地** — 查看聯盟階級、等級和神器資訊

支援手機、平板、電腦，隨時隨地都能查。

## 100% Vibe Coding

這個專案完全由 AI 輔助開發（vibe coding），從第一行程式碼到每個功能都是如此。我們相信這是一種全新的開發方式，也歡迎大家一起來體驗！

如果你有任何想法、發現 bug、或想要新功能，歡迎到 [Issues](../../issues) 提出，讓我們一起把 Maple Hub 變得更好。

## 資料來源

角色資料來自 [Nexon MapleStory OpenAPI](https://openapi.nexon.com/)，遊戲素材圖示來自 [maplestory.io](https://maplestory.io/)。

## 給開發者

如果你想在本地跑起來：

```bash
git clone https://github.com/hanshino/maple-hub.git
cd maple-hub
npm install
npm run dev
```

然後打開 http://localhost:3000 就可以了。

需要設定 Nexon OpenAPI 金鑰和 Google Sheets API 才能使用完整功能，詳見 `.env.local.example` 或專案中的 `CLAUDE.md`。

```bash
npm run test         # 跑測試
npm run lint         # 檢查程式碼
npm run build        # 建置生產版本
```

## 授權

本專案採用 MIT 授權。

## 致謝

- [Nexon Corporation](https://openapi.nexon.com/) — MapleStory OpenAPI
- [maplestory.io](https://maplestory.io/) — 遊戲素材資源
