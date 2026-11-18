@echo off
chcp 65001 >nul
title Firebase Hosting 部署精靈
echo 正在啟動 Firebase Hosting 一鍵部署程式...
powershell -ExecutionPolicy Bypass -File "%~dp0deploy_firebase.ps1"
pause
