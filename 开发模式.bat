@echo off
chcp 65001 >nul
title Tavern Card Helper (开发模式)
echo ====================================
echo   Tavern Card Helper 开发模式
echo ====================================
echo.

cd /d "%~dp0"

echo 正在启动开发服务器（支持热更新）...
echo.

call npm run dev
