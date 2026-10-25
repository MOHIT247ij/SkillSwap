@echo off
title SkillSwap - Push to GitHub
cd /d "%~dp0"
echo.
echo  ==========================================
echo     SkillSwap - GitHub pe push ho raha hai
echo  ==========================================
echo.
where git >NUL 2>&1
if errorlevel 1 (
  echo [X] Git install nahi hai. Yahan se install karo: https://git-scm.com/download/win
  start https://git-scm.com/download/win
  pause
  exit /b
)
if not exist ".git" (
  git init
  git branch -M main
)
git config user.name >NUL 2>&1 || git config user.name "MOHIT247ij"
git config user.email >NUL 2>&1 || git config user.email "MOHIT247ij@users.noreply.github.com"
echo [1/3] Files add kar rahe hain (.env aur node_modules skip honge)...
git add -A
git commit -q -m "SkillSwap: MERN skill exchange platform" -m "Features: smart matching, real-time chat, WebRTC video call, Google login, AI SkillBot, skill quiz, gamification, analytics, CSV export." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01UvKWXGQkqQPapMWTNEGJNa"
git remote get-url origin >NUL 2>&1 || git remote add origin https://github.com/MOHIT247ij/SkillSwap.git
echo [2/3] GitHub pe push... (pehli baar GitHub sign-in window khul sakti hai)
git push -u origin main
if errorlevel 1 (
  echo.
  echo [!] Push fail hua. Shayad GitHub pe "SkillSwap" repo abhi bani nahi hai.
  echo     1. Jo page khulega usme Repository name: SkillSwap likho
  echo     2. README / .gitignore / license kuch bhi TICK MAT karna
  echo     3. Create repository dabao, phir yeh file dobara double-click karo
  start https://github.com/new
) else (
  echo.
  echo [3/3] [OK] Done! Repo: https://github.com/MOHIT247ij/SkillSwap
  start https://github.com/MOHIT247ij/SkillSwap
)
echo.
pause
