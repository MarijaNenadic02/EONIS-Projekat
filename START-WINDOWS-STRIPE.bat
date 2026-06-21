@echo off
setlocal enableextensions
cd /d "%~dp0"

echo ==================================================
echo    Essence - run WITH Stripe test payments
echo ==================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo Install Node.js LTS from https://nodejs.org/ then run this again.
  pause
  exit /b 1
)

node "scripts\dev-with-stripe.mjs"

echo.
pause
