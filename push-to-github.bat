@echo off
chcp 65001 >nul
echo ========================================================
echo        Faiza Zone - GitHub Sync & Auto Push Tool
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking file changes...
git status --short

set /p COMMIT_MSG="Commit message likhun (Enter dile auto-message hobe): "
if "%COMMIT_MSG%"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
    set COMMIT_MSG=Update: %date% %time%
)

echo.
echo [2/3] Staging and Committing...
git add .
git commit -m "%COMMIT_MSG%"

echo.
echo [3/3] Pushing to GitHub (origin main)...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  SUCCESS: GitHub-e shofolbhabe upload hoye gechhe!
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  ERROR: GitHub-e push korte shomossha hoyechhe.
    echo  Internet connection ba GitHub permission check korun.
    echo ========================================================
)

echo.
pause
