// Firebase Configuration File
// 可以在此填入你的 Firebase 設定（從 Firebase Console -> 專案設定 -> 一般 -> 你的應用程式 取得）
// 填入後將自動解鎖「跨裝置、跨電腦、全互聯網真實即時聯機」！
// 若未填入，遊戲將自動使用 BroadcastChannel 跨分頁本機聯機模式。

window.firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// 支援從瀏覽器 localStorage 讀取動態設定（可於遊戲大廳右上角直接點擊「☁️ Firebase 設定」輸入）
try {
  const customConfig = localStorage.getItem('mp_firebase_config');
  if (customConfig) {
    const parsed = JSON.parse(customConfig);
    if (parsed.apiKey && (parsed.databaseURL || parsed.projectId)) {
      window.firebaseConfig = parsed;
    }
  }
} catch (e) {}
