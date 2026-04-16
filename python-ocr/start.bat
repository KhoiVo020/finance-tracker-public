@echo off
echo Starting Finance Tracker OCR Service...
echo.

cd /d "%~dp0"

:: Check if venv exists, create it otherwise
if not exist "venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv venv
    echo Installing dependencies (EasyOCR model will download ~100MB on first run)...
    venv\Scripts\pip install -r requirements.txt
)

echo.
echo OCR Service starting on http://localhost:8000
echo Keep this window open while using the Finance Tracker.
echo.
venv\Scripts\uvicorn main:app --host 0.0.0.0 --port 8000 --reload
