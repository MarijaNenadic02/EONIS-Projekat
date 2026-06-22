@echo off
setlocal enableextensions
cd /d "%~dp0"

echo ==================================================
echo    SCENTIQ - Web Parfumerija : Windows setup
echo ==================================================
echo.

REM ---- 1. Check Node.js ----
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo.
  echo Please install Node.js LTS from:  https://nodejs.org/
  echo Then double-click this file again.
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node -v') do echo Using Node %%v
echo.

REM ---- 2. Backend dependencies ----
echo [1/5] Installing backend dependencies (this can take a minute)...
cd /d "%~dp0server"
call npm install
if errorlevel 1 goto :error
if not exist ".env" (
  echo      Creating server\.env from template
  copy /y ".env.example" ".env" >nul
)

REM ---- 3. Database ----
echo [2/5] Preparing the database...
call npx prisma generate
if errorlevel 1 goto :error
call npx prisma migrate deploy
if errorlevel 1 goto :error

echo [3/5] Loading demo data (products + accounts)...
call npm run seed
if errorlevel 1 goto :error

REM ---- 4. Frontend dependencies ----
echo [4/5] Installing frontend dependencies...
cd /d "%~dp0client"
call npm install
if errorlevel 1 goto :error
if not exist ".env" (
  echo      Creating client\.env from template
  copy /y ".env.example" ".env" >nul
)

REM ---- 5. Launch ----
echo [5/5] Starting the app...
start "SCENTIQ Backend"  /D "%~dp0server" cmd /k "npm run dev"
start "SCENTIQ Frontend" /D "%~dp0client" cmd /k "npm run dev"

echo.
echo Waiting for the servers to start...
timeout /t 12 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo ==================================================
echo   Done. The shop should open at:
echo       http://localhost:5173
echo.
echo   Sign in with:
echo     Admin     admin@scentiq.test    / admin123
echo     Customer  customer@scentiq.test / customer123
echo.
echo   Two new terminal windows opened (backend + frontend).
echo   KEEP THEM OPEN while testing. Close them to stop the app.
echo ==================================================
echo.
pause
exit /b 0

:error
echo.
echo [ERROR] A step above failed. Scroll up to read the message.
echo Common causes: no internet connection, or Node.js not installed.
echo.
pause
exit /b 1
