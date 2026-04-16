@echo off
setlocal

set "APP_DIR=%~dp0"
set "OCR_DIR=%APP_DIR%python-ocr"
set "APP_URL=http://localhost:3001"

echo Starting Finance Tracker public app...
echo.

if not exist "%APP_DIR%.env.local" (
    echo Creating .env.local from .env.example...
    copy "%APP_DIR%.env.example" "%APP_DIR%.env.local" >nul
)

if not exist "%OCR_DIR%\venv\Scripts\python.exe" (
    echo Creating OCR virtual environment...
    cd /d "%OCR_DIR%"
    python -m venv venv
    echo Installing OCR dependencies. EasyOCR may download its model on first use.
    call "venv\Scripts\python.exe" -m pip install -r requirements.txt
)

if not exist "%APP_DIR%node_modules\.bin\next.cmd" (
    echo Installing frontend dependencies...
    cd /d "%APP_DIR%"
    call npm install
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>nul
if errorlevel 1 (
    echo Starting OCR service on http://localhost:8000...
    start "Finance Tracker OCR" /D "%OCR_DIR%" cmd /k "venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000"
) else (
    echo OCR service is already running on http://localhost:8000.
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "if (Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" >nul 2>nul
if errorlevel 1 (
    echo Starting web app on %APP_URL%...
    start "Finance Tracker Web" /D "%APP_DIR%" cmd /k "npm run dev"
) else (
    echo Web app is already running on %APP_URL%.
)

echo Waiting for the web app to respond...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$url = '%APP_URL%'; for ($i = 0; $i -lt 60; $i++) { try { Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { Start-Sleep -Seconds 1 } }; exit 1" >nul 2>nul

echo Opening %APP_URL%...
start "" "%APP_URL%"

echo.
echo Keep the OCR and web app windows open while using Finance Tracker.
endlocal
