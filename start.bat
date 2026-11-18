@echo off
chcp 65001 >nul
echo 正在啟動遊戲伺服器...
powershell -ExecutionPolicy Bypass -File "%~dp0start_server.ps1"
pause
