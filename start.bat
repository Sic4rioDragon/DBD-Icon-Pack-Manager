@echo off
setlocal

cd /d "%~dp0"

echo.
echo Starting DBD Icon Pack Manager...
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found.
  echo Please install Node.js first, then run install.bat again.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo node_modules folder was not found.
  echo Running npm install first...
  echo.
  npm install

  if errorlevel 1 (
    echo.
    echo ERROR: npm install failed.
    echo.
    pause
    exit /b 1
  )
)

npm start

if errorlevel 1 (
  echo.
  echo ERROR: App failed to start.
  echo.
  pause
  exit /b 1
)

pause