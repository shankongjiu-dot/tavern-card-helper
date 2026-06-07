@echo off
chcp 65001 >nul
echo ====================================
echo   创建桌面快捷方式
echo ====================================
echo.

cd /d "%~dp0"
cscript //nologo "%~dp0create-shortcut.vbs"

echo.
echo ✅ 快捷方式已创建到桌面！
echo.
echo 双击桌面上的 "Tavern Card Helper" 即可一键启动
echo ====================================
pause
