@echo off
title JOBLEX - Starting Platform Server
echo ========================================================
echo   JOBLEX Platform Launcher
echo   Frontend: Pure HTML5, CSS3, JavaScript (ES6+)
echo   Backend: Dedicated Node.js (JavaScript) or Python (Flask)
echo ========================================================

echo.
echo Launching Node.js Backend Server on http://localhost:5000...
start "JOBLEX Backend Server" cmd /k "cd /d "%~dp0" && node backend/server.js"

timeout /t 2 >nul

echo.
echo Opening JOBLEX in your default browser...
start http://localhost:5000

echo.
echo ========================================================
echo Platform is running live at http://localhost:5000
echo Backend Team Workspace: backend/
echo Frontend Team Workspace: js/frontend/
echo (To run Python Flask backend instead: python backend/app.py)
echo ========================================================
pause
