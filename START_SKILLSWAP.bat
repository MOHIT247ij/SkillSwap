@echo off
title SkillSwap - Server + Website
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
echo [3/3] Server + Website start... browser 30 second mein khulega
echo  (Is window ko BAND MAT KARNA. Band karne ke liye Ctrl+C dabao)
echo.
start "" /min cmd /c "timeout /t 30 /nobreak >NUL & start http://localhost:5174"
call npm run dev
pause
