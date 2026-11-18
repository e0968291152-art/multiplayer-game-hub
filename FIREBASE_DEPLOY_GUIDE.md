# Firebase 網頁部署與雲端多人聯機指南

本專案已為您完整配置了 **Firebase Hosting** 部署環境與 **Firebase Realtime Database** 跨裝置互聯網聯機支援！

---

## ⚡ 方式一：一鍵自動部署（最推薦、超簡單）

我們為您製作了 **一鍵部署腳本**，無需手動打指令或複雜配置：

### 步驟 1：建立免費 Firebase 專案（約 1 分鐘）
1. 打開瀏覽器前往 [Firebase 控制台 (Firebase Console)](https://console.firebase.google.com/)。
2. 點擊 **「新增專案」**（例如命名為 `my-game-hub-2026`）。
3. 記下專案的 **專案 ID (Project ID)**（通常為小寫英數組合，如 `my-game-hub-2026`）。

### 步驟 2：執行一鍵部署
1. 打開資料夾：`C:\Users\Admin\.gemini\antigravity\scratch\multiplayer-game-hub`
2. 雙擊執行 **`deploy_firebase.bat`**。
3. 腳本會自動檢查並下載 Firebase CLI，接著會彈出瀏覽器讓您點擊登入 Google 帳號。
4. 在終端機中輸入您的專案 ID（例如 `my-game-hub-2026`）並按下 Enter。
5. 部署完成後，即可直接獲得您的線上專屬網址：
   👉 **`https://<您的專案ID>.web.app`**
   👉 **`https://<您的專案ID>.firebaseapp.com`**

---

## 🌐 方式二：手動指令部署（如果您習慣用命令列）

如果您電腦上已安裝 Node.js，亦可在終端機執行：

```powershell
# 1. 進入遊戲目錄
cd C:\Users\Admin\.gemini\antigravity\scratch\multiplayer-game-hub

# 2. 安裝 Firebase 工具（若尚未安裝）
npm install -g firebase-tools

# 3. 登入 Firebase
firebase login

# 4. 綁定專案 ID
firebase use <您的專案ID>

# 5. 一鍵發布上線
firebase deploy --only hosting
```

發布完成後，終端機將輸出 Hosting 網址，全世界任何裝置（手機、平板、電腦）皆可透過該網址即刻進入遊戲大廳！

---

## ☁️ 進階功能：開啟「跨電腦、跨手機真實互聯網多人對戰」

專案預設已支援同台電腦多標籤頁即時聯機（使用 HTML5 `BroadcastChannel`）。
若您想讓**不同電腦或手機的朋友從外網連進來一起玩**，只需在 Firebase 開啟免費的 Realtime Database：

1. 在 [Firebase 控制台](https://console.firebase.google.com/) 左側選單點選 **「建構」➔「Realtime Database」**。
2. 點擊 **「建立資料庫」**（伺服器位置選預設即可）。
3. 安全性規則選擇 **「以測試模式啟動」**（允許讀寫）並按確定。
4. 複製您的資料庫網址（格式如：`https://<您的專案ID>-default-rtdb.firebaseio.com/`）。
5. 打開已部署好的線上遊戲網頁，點選右上角的 **「☁️ 雲端聯機設定」** 按鈕，貼上資料庫網址與 API Key，點擊「儲存並連線」。
6. 完成！現在只要把網址發給朋友，所有人就能在各自的裝置上進入同一個房間連線同樂！
