@echo off
chcp 65001 >nul
title GitHub 專案推送精靈
echo 正在啟動 GitHub 一鍵推送程式...
powershell -ExecutionPolicy Bypass -File "%~dp0push_to_github.ps1"
pause
