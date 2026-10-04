@echo off
chcp 65001 >nul
title Faiza Zone - Auto Sync to GitHub
cd /d "%~dp0"
node scripts\auto-sync.js
pause
