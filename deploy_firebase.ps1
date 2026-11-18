# Firebase Hosting 一鍵部署腳本 (PowerShell)
# 支援自動偵測 Firebase CLI、免安裝 standalone 執行檔下載、自動部署
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [Firebase Hosting 一鍵網頁部署精靈]" -ForegroundColor Green
Write-Host " 準備將多元遊戲大廳部署至全球 CDN 網際網路！" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

$projectDir = $PSScriptRoot
Set-Location $projectDir

# 1. 檢查是否有 firebase 指令
$firebaseCmd = "firebase"
$hasFirebase = $false

try {
    $null = Get-Command firebase -ErrorAction Stop
    $hasFirebase = $true
} catch {
    $hasFirebase = $false
}

if (-not $hasFirebase) {
    # 檢查本機是否已有下載過 standalone firebase.exe
    $localExe = Join-Path $projectDir "firebase.exe"
    if (Test-Path $localExe) {
        $firebaseCmd = $localExe
        $hasFirebase = $true
    } else {
        Write-Host "⚠️ 偵測到系統尚未安裝 Firebase CLI。" -ForegroundColor Yellow
        Write-Host "正在從 Google 官方自動下載免安裝版 Firebase CLI (firebase-tools)..." -ForegroundColor Cyan
        try {
            $downloadUrl = "https://firebase.tools/bin/win/instant/latest"
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $downloadUrl -OutFile $localExe -UseBasicParsing
            Write-Host "✅ 下載完成！" -ForegroundColor Green
            $firebaseCmd = $localExe
            $hasFirebase = $true
        } catch {
            Write-Host "❌ 自動下載失敗，請先手動安裝 Node.js 並執行: npm install -g firebase-tools" -ForegroundColor Red
            Write-Host "或直接前往 Firebase Console 手動上傳或設定。" -ForegroundColor Yellow
            pause
            exit 1
        }
    }
}

# 2. Firebase 登入
Write-Host ""
Write-Host "[步驟 1/3] 驗證 Google / Firebase 帳號登入..." -ForegroundColor Cyan
Write-Host "即將彈出瀏覽器視窗，請登入您的 Google 帳號並允許 Firebase 存取授權。" -ForegroundColor Gray
& $firebaseCmd login

# 3. 設定或選擇專案 ID
Write-Host ""
Write-Host "[步驟 2/3] 設定 Firebase 專案 ID" -ForegroundColor Cyan
Write-Host "請登入 https://console.firebase.google.com/ 查看或建立您的 Firebase 專案。" -ForegroundColor White

$projId = Read-Host "請輸入您的 Firebase 專案 ID (Project ID，例如 my-game-hub-123)"
if ($projId -and $projId.Trim() -ne "") {
    $projId = $projId.Trim()
    $rcContent = @"
{
  "projects": {
    "default": "$projId"
  }
}
"@
    $rcContent | Out-File -Encoding utf8 (Join-Path $projectDir ".firebaserc")
    Write-Host "✅ 已鎖定專案 ID: $projId" -ForegroundColor Green
}

# 4. 執行部署
Write-Host ""
Write-Host "[步驟 3/3] 開始部署靜態網頁至 Firebase Hosting..." -ForegroundColor Cyan
& $firebaseCmd deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "🎉 恭喜！遊戲已成功部署至網際網路！" -ForegroundColor Green
    if ($projId) {
        Write-Host " 線上遊玩網址: https://$projId.web.app" -ForegroundColor Yellow
        Write-Host " 備用網址: https://$projId.firebaseapp.com" -ForegroundColor Yellow
    }
    Write-Host " 您可以將網址分享給朋友，在不同電腦、手機上同時在線遊玩！" -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ 部署過程中發生錯誤，請檢查專案 ID 是否正確或是否有建立 Hosting 服務。" -ForegroundColor Red
}

pause
