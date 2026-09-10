@echo off
setlocal
set PATH=%PATH%;C:\Program Files\Git\cmd
cd /d "%~dp0"
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo   hamcat.live — push des modifs
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
git status
echo.
set /p MSG="Message de commit (ex: feat: description) : "
if "%MSG%"=="" set MSG=chore: sauvegarde en cours
git add -A
git commit -m "%MSG%"
git push origin main
echo.
echo Push terminé !
pause
