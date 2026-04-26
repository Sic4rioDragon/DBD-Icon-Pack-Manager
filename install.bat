@echo off
setlocal

cd /d "%~dp0"

echo.
echo Installing DBD Icon Pack Manager dependencies...
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found.
  echo Please install Node.js first, then run this file again.
  echo.
  pause
  exit /b 1
)

npm install

if errorlevel 1 (
  echo.
  echo ERROR: npm install failed.
  echo.
  pause
  exit /b 1
)

echo.
echo Done. You can now run start.bat.
echo.
pause