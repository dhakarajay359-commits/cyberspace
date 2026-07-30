@echo off
title Cyberspace Dashboard - All Services

echo ============================================
echo   CYBERSPACE DASHBOARD - Starting Services
echo ============================================
echo.

REM ── 1. Start Node.js Terminal Backend (port 3001) ──────────────────────────
echo [1/2] Starting Terminal Backend (port 3001)...
start "Terminal Backend :3001" cmd /k "cd /d %~dp0..\linux-terminal\backend && node dist/index.js"
timeout /t 2 /nobreak >nul

REM ── 2. Start Flask Dashboard (port 5000) ───────────────────────────────────
echo [2/2] Starting Flask Dashboard (port 5000)...
start "Flask Dashboard :5000" cmd /k "cd /d %~dp0 && python app.py"
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   All services started!
echo   Dashboard : http://127.0.0.1:5000
echo   Terminal  : http://127.0.0.1:3001
echo ============================================
echo.
echo   Pages available:
echo     /          Login
echo     /dashboard Dashboard
echo     /learn     Learn + Videos
echo     /practice  Kali Terminal
echo     /compete   CTF Challenges
echo     /academy   Academy
echo ============================================
echo.
pause
