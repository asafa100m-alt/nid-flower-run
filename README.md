# RUN FOR FLOWERS 花園路跑 — 報名

NID October Family Day
**2026.10.31（六）08:50–11:00・大安森林公園環形迴廊**

兩條路線，同一個起終點：

| 組別 | 內容 | 非當期學員費用 |
| --- | --- | --- |
| 拾花巡禮 | 公園 → 禮洋 → 浪花 → Tipsy → 公園，約 5.1–5.6 km，三站各收一枝花 | NT$500 |
| 安森秋跑 | 留在大安森林公園跑圈，不停站，2–4 圈 | NT$500 |

兩組回到終點都有浪花花藝的現場教學與包裝。報名截止 **2026/10/24 24:00**（花材需向花店預訂）。組別送出後不得更換，當天也不接受臨時換組。

## 檔案

| 檔案 | 說明 |
| --- | --- |
| `index.html` | 報名頁本體，單一檔案（圖片以 base64 內嵌），發佈於 GitHub Pages |
| `apps-script-backend.gs` | 後台程式碼的版本控制副本，實際執行的是 Apps Script 專案 |

## 上線步驟

1. **後台**：到 [script.google.com](https://script.google.com) 新增專案，把 `apps-script-backend.gs` 整份貼進 `Code.gs`。
2. 改掉檔案開頭的 `ADMIN_KEY`（那是名單的鑰匙，不要留預設值）。
3. 執行一次 `setupSheet()` — 會自動建立試算表並寫好表頭，執行紀錄裡會印出網址。
4. **部署** → 新增部署作業 → 網頁應用程式，執行身分「我」、存取權限「所有人」。
   必須用 `events@nidrc.com` 登入才有部署權。
5. 複製 `/exec` 網址，填進 `index.html` 最上方的 `SCRIPT_URL` 常數。
6. 把 `index.html` 推上 GitHub，Settings → Pages 選 `main` 分支的根目錄發佈。

`SCRIPT_URL` 留空時，報名頁會跑在 DEMO 模式：流程可以完整點過，但不會寫入任何資料。

## 看報名資料

- **試算表**：執行 `setupSheet()` 或 `showStatus()`，執行紀錄會印出網址。
- **網頁名單**：`<你的 /exec 網址>?action=list&key=<ADMIN_KEY>`
  含人數統計、分組計數、應收金額與未繳筆數。
- **純數字**：`?action=stats&key=<ADMIN_KEY>` 回傳 JSON。

## 後台行為

- 報名截止、Email 重複、欄位格式都在**伺服器端**再驗一次，不信任前端送來的值。
- 費用一律由後端依「組別 × 戰隊」重算，前端送來的 `fee` 不採用。
- 寫入時加 `LockService` 鎖，避免同時送出造成漏行。
- 報名成功會自動寄確認信；信寄失敗不會讓報名失敗，只記在執行紀錄裡。

## 相關

- NID 官方 LINE：<https://page.line.me/eei8717i>
- 活動 LINE 社群：報名完成頁與確認信裡的「加入活動 LINE 社群」按鈕
