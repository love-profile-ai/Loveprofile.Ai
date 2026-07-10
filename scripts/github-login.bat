@echo off
REM Sign in to GitHub as love-profile-ai (opens browser)
cd /d "%~dp0.."
git remote set-url origin https://github.com/love-profile-ai/Loveprofile.Ai.git
git credential-manager github login --url https://github.com
echo.
echo After signing in as love-profile-ai, run:
echo   git push -u origin main
pause
