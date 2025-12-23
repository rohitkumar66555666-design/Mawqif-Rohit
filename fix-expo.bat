@echo off
echo ========================================
echo Expo Fix Script for Windows
echo ========================================
echo.

echo Step 1: Stopping any running Metro bundler...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo Step 2: Clearing Expo cache...
call npx expo start -c --no-dev --minify
timeout /t 2 /nobreak >nul

echo Step 3: Clearing npm cache...
call npm cache clean --force

echo Step 4: Checking for port conflicts...
netstat -ano | findstr :8081
netstat -ano | findstr :19000

echo.
echo ========================================
echo Cache cleared! Now starting Expo...
echo ========================================
echo.
echo Choose startup mode:
echo 1. Normal mode
echo 2. Tunnel mode (for network issues)
echo 3. Clear cache and reinstall
echo.
set /p choice="Enter choice (1-3): "

if "%choice%"=="1" (
    echo Starting in normal mode...
    call npx expo start -c
) else if "%choice%"=="2" (
    echo Starting in tunnel mode...
    call npx expo start -c --tunnel
) else if "%choice%"=="3" (
    echo Clearing node_modules and reinstalling...
    rmdir /s /q node_modules
    rmdir /s /q .expo
    del package-lock.json
    call npm install
    call npx expo start -c
) else (
    echo Invalid choice. Starting in normal mode...
    call npx expo start -c
)

pause
