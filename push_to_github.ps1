# GitHub 一鍵推送腳本 (支援自動下載 MinGit 或使用系統 Git)
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " [GitHub 一鍵程式碼推送精靈]" -ForegroundColor Green
Write-Host " 準備將多元遊戲大廳專案推送至您的 GitHub 儲存庫！" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

$projectDir = $PSScriptRoot
Set-Location $projectDir

# 1. 檢查 Git 是否存在
$gitCmd = "git"
$hasGit = $false
try {
    $null = Get-Command git -ErrorAction Stop
    $hasGit = $true
} catch {
    $hasGit = $false
}

if (-not $hasGit) {
    # 檢查是否有本地免安裝 MinGit
    $localGit = Join-Path $projectDir "mingit\cmd\git.exe"
    if (Test-Path $localGit) {
        $gitCmd = $localGit
        $hasGit = $true
    } else {
        Write-Host "⚠️ 偵測到本機尚未安裝 Git。" -ForegroundColor Yellow
        Write-Host "正在為您自動下載免安裝版 MinGit (約 25MB)..." -ForegroundColor Cyan
        try {
            $zipUrl = "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/MinGit-2.44.0-64-bit.zip"
            $zipFile = Join-Path $projectDir "mingit.zip"
            $destDir = Join-Path $projectDir "mingit"
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile -UseBasicParsing
            Expand-Archive -Path $zipFile -DestinationPath $destDir -Force
            Remove-Item -Force $zipFile
            $gitCmd = Join-Path $destDir "cmd\git.exe"
            $hasGit = $true
            Write-Host "✅ MinGit 下載解壓完成！" -ForegroundColor Green
        } catch {
            Write-Host "❌ 自動下載 MinGit 失敗，請手動前往 https://git-scm.com/download/win 安裝 Git。" -ForegroundColor Red
            pause
            exit 1
        }
    }
}

# 2. 獲取用戶 GitHub 倉庫網址
Write-Host ""
Write-Host "請在 GitHub (https://github.com/new) 建立一個新儲存庫（Repository，例如命名為 multiplayer-game-hub）。" -ForegroundColor Yellow
$repoUrl = Read-Host "請貼上您的 GitHub 儲存庫網址 (例如 https://github.com/您的帳號/multiplayer-game-hub.git)"

if (-not $repoUrl -or $repoUrl.Trim() -eq "") {
    Write-Host "未輸入儲存庫網址，操作已取消。" -ForegroundColor Red
    pause
    exit 1
}

$repoUrl = $repoUrl.Trim()

# 3. 初始化並提交
Write-Host ""
Write-Host "正在初始化本地 Git 並建立版本提交..." -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $projectDir ".git"))) {
    & $gitCmd init
}

# 設定基本使用者資訊避免報錯
& $gitCmd config user.name "GameHub Developer"
& $gitCmd config user.email "developer@example.com"

& $gitCmd branch -M main
& $gitCmd add .
& $gitCmd commit -m "feat: 初次發布計算機概論專題：多元在線遊戲平台 (海龜湯、狼人殺、陣營對抗戰)"

# 綁定 Remote
& $gitCmd remote remove origin 2>$null
& $gitCmd remote add origin $repoUrl

# 4. 推送至 GitHub
Write-Host ""
Write-Host "正在推送代碼至 GitHub: $repoUrl ..." -ForegroundColor Cyan
Write-Host "（若彈出登入視窗，請依序完成 GitHub 授權）" -ForegroundColor Gray
& $gitCmd push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "🎉 程式碼已成功推送至 GitHub！" -ForegroundColor Green
    $cleanUrl = $repoUrl -replace "\.git$", ""
    Write-Host " 您的 GitHub 專案網址: $cleanUrl" -ForegroundColor Yellow
    Write-Host " 提示：您可以在該儲存庫的 Settings -> Pages 開啟 GitHub Pages 免費網頁代管！" -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ 推送失敗，請確認儲存庫網址與存取權限是否正確。" -ForegroundColor Red
}

pause
