@echo off
cd /d "%~dp0"
echo ==========================================================
echo   Aurora Hourglass - local preview server
echo   Open:  http://localhost:8080/src/
echo   Close this window to stop the server.
echo ==========================================================
where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] Python not found.
    echo Please just double-click index.html to view the scene,
    echo or serve this folder with any static web server.
    pause
    exit /b 1
  )
  start "aurora-preview" cmd /c "py -m http.server 8080"
  goto open
)
start "aurora-preview" cmd /c "python -m http.server 8080"
:open
timeout /t 2 >nul
start "" http://localhost:8080/src/
echo Server started in a separate window. Press any key to close this one.
pause >nul
