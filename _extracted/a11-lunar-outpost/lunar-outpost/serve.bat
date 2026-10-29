@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   月球前哨站 · 本地预览
echo   http://localhost:8080/index-offline.html
echo   (关闭此窗口即停止服务)
echo.
start "" http://localhost:8080/index-offline.html
python -m http.server 8080
if errorlevel 1 (
  echo.
  echo   没找到 python，试试 npx serve
  npx --yes serve -l 8080 .
)
pause
