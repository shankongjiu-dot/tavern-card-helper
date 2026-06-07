@echo off
chcp 65001 >nul
title Tavern Card Helper
echo ====================================
echo   Tavern Card Helper 正在启动...
echo ====================================
echo.

cd /d "%~dp0"

:: Build if dist doesn't exist
if not exist "dist" (
    echo [1/3] 正在构建项目...
    call npm run build
    echo.
)

:: Start server and open browser
echo [2/3] 正在启动服务器...
echo [3/3] 打开浏览器...
echo.
echo   访问地址: http://localhost:3001
echo   按 Ctrl+C 可关闭服务器
echo ====================================
echo.

:: Start the server and open browser
start "" http://localhost:3001
call npm run start
