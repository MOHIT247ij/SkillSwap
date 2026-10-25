@echo off
title SkillSwap - Live Log
cd /d "%~dp0"
echo.
echo  ==========================================
echo     SkillSwap start ho raha hai...
echo  ==========================================
echo.
echo [1/3] Purane Node process band kar rahe hain...
taskkill /F /IM node.exe >NUL 2>&1
echo [2/3] Packages check kar rahe hain...
if not exist "node_modules" call npm install
if not exist "server\node_modules" call npm install --prefix server
if not exist "client\node_modules" call npm install --prefix client
if not exist "logs" mkdir logs
echo [3/3] Server + Website start... browser 30 second mein khulega
start "SkillSwap Engine" /min cmd /c "npm run dev > logs\skillswap.log 2>&1"
start "" /min cmd /c "timeout /t 30 /nobreak >NUL & start http://localhost:5174"
echo.
echo  Neeche live log dikhega. Band karna ho toh STOP_SKILLSWAP.bat chalao.
echo.
timeout /t 3 /nobreak >NUL
powershell -NoProfile -Command "Get-Content -Path 'logs\skillswap.log' -Wait -Tail 60"
