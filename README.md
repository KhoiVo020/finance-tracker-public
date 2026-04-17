# Finance Tracker Public

A public demo version of a personal finance tracker built with Next.js, React, Prisma, and a local Python OCR service.

The app runs in demo mode by default, so it can be opened without connecting a private email account, bank account, or production database. Demo data is seeded in memory and resets when the app process restarts.

## Features

- Dashboard with income, expense, and balance summaries.
- Transaction list with manual add, edit, and delete workflows.
- Category analytics grouped by income and expense categories.
- Category manager for custom income and expense categories.
- Grocery receipt tracking with receipt-level itemization.
- Grocery price history and grocery group management.
- Statement upload support for CSV, PDF, and image files.
- Local OCR service for receipt and image parsing.
- Demo mode for public sharing without private integrations.

## Tech Stack

- Next.js 16.2.2
- React 19.2.4
- TypeScript
- Prisma 6 with SQLite support for private/local database mode
- Recharts for charts
- Python FastAPI OCR service
- EasyOCR, OpenCV, Pillow, and Uvicorn

## Quick Start on Windows

From the repo root:

```powershell
cd d:\ANTIGRAVITY\finance-tracker-public
.\start.bat
```

The launcher will:

- Create `.env.local` from `.env.example` if it does not exist.
- Create the Python OCR virtual environment if needed.
- Install OCR dependencies if needed.
- Install frontend dependencies if `node_modules` is missing.
- Start the OCR service on `http://localhost:8000`.
- Start the Next.js app on `http://localhost:3001`.
- Open `http://localhost:3001` in your browser.

Keep the OCR and web app terminal windows open while using the app.

## Android Deployment Path

The Android-ready path is to deploy this app as a hosted PWA and wrap it with a Trusted Web Activity (TWA). That keeps the existing Next.js Server Actions, Prisma access, AI parsing, and OCR integration on hosted services while Android opens the production HTTPS app fullscreen.

See the step-by-step guide:

```text
docs/android-deployment.md
```

The short version:

- Deploy the Next.js app to a Node-capable host.
- Deploy `python-ocr/main.py` as a separate HTTPS OCR API.
- Set `NEXT_PUBLIC_APP_URL` to the production app URL.
- Set `OCR_SERVICE_URL` to the hosted OCR API URL.
- Generate the Android wrapper with Bubblewrap from `https://your-domain.example/manifest.webmanifest`.

## Manual Setup

Install frontend dependencies:

```powershell
npm install
```

Create the local environment file:

```powershell
Copy-Item .env.example .env.local
```

Install the OCR service dependencies:

```powershell
cd python-ocr
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..
```

Start the OCR service:

```powershell
cd python-ocr
.\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

In a second terminal, start the web app:

```powershell
cd d:\ANTIGRAVITY\finance-tracker-public
npm run dev
```

Open:

```text
http://localhost:3001
```

## Environment Variables

Copy `.env.example` to `.env.local`.

```env
NODE_ENV="development"
DEMO_MODE="true"
NEXT_PUBLIC_DEMO_MODE="true"
NEXT_PUBLIC_APP_URL="http://localhost:3001"

# Optional database for private/local persistence
# DATABASE_URL="file:./prisma/dev.db"

# Optional AI features
GEMINI_API_KEY=""

# Optional OCR / parsing features
OCR_SERVICE_URL="http://127.0.0.1:8000"
PLAID_CLIENT_ID=""
PLAID_SECRET=""
PLAID_ENV="sandbox"
```

### Demo Mode

Demo mode is enabled by default:

```env
DEMO_MODE="true"
NEXT_PUBLIC_DEMO_MODE="true"
```

In demo mode, the app uses seeded in-memory data instead of requiring a database. This is the recommended mode for the public version.

### Database Mode

For a private/local persistent setup, disable demo mode and provide a SQLite database URL:

```env
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"
DATABASE_URL="file:./prisma/dev.db"
```

Then generate Prisma client files:

```powershell
npx prisma generate
```

If you add migrations later, run the appropriate Prisma migration command for your setup.

## OCR Service

The Next.js app calls the OCR service at:

```text
http://127.0.0.1:8000
```

Override this for hosted deployments with:

```env
OCR_SERVICE_URL="https://your-ocr-service.example"
```

Health check:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:8000/health -UseBasicParsing
```

Expected response:

```json
{"status":"ok"}
```

The first OCR run may take longer because EasyOCR may download its model files.

## NPM Scripts

```powershell
npm run dev
```

Starts the development server on `http://localhost:3001` using Webpack mode. Webpack mode is used because Turbopack was observed to bind the port but hang during page compilation in this local setup.

```powershell
npm run build
```

Creates a production build.

```powershell
npm start
```

Starts the production server on `http://localhost:3001`. Run `npm run build` first.

```powershell
npm run lint
```

Runs ESLint.

Current note: lint may fail because the Python virtual environment under `python-ocr/venv` is being scanned, and several existing app files still use explicit `any` types. The production build currently passes in demo mode.

## Project Structure

```text
.
+-- prisma/
|   +-- schema.prisma
+-- python-ocr/
|   +-- main.py
|   +-- grocery_receipt.py
|   +-- requirements.txt
|   +-- start.bat
+-- src/
|   +-- app/
|   |   +-- actions.ts
|   |   +-- page.tsx
|   |   +-- transactions/
|   |   +-- groceries/
|   |   +-- categories/
|   +-- components/
|   +-- lib/
+-- .env.example
+-- package.json
+-- start.bat
```

## App Routes

- `/` - dashboard
- `/transactions` - transaction management
- `/groceries` - grocery receipts and grocery item tracking
- `/categories` - category analytics and category management

## Public Release Notes

This public version removes private email synchronization from the app flow.

The public demo is designed to run locally with anonymous seeded data. Optional private integrations can be added through environment variables and database configuration, but they are not required to open the app.

This repository is self-contained for normal development and does not require any AI-agent instruction files. The app can be installed, run, built, and published using only the files documented above.

## Troubleshooting

### Port 3001 is already in use

Close the existing terminal running the web app, or find the process:

```powershell
netstat -aon | findstr ":3001"
```

Then stop the process by PID:

```powershell
Stop-Process -Id <PID> -Force
```

### Port 8000 is already in use

Close the existing OCR terminal, or find the process:

```powershell
netstat -aon | findstr ":8000"
```

Then stop the process by PID:

```powershell
Stop-Process -Id <PID> -Force
```

### OCR startup is slow

The first run can be slow while EasyOCR initializes or downloads model files. Keep the OCR terminal open until it finishes startup.

### Build complains about `DATABASE_URL`

Use demo mode for the public version:

```env
DEMO_MODE="true"
NEXT_PUBLIC_DEMO_MODE="true"
```

If you intentionally disable demo mode, set `DATABASE_URL` and generate the Prisma client.

## Verification

Useful checks:

```powershell
npm run build
Invoke-WebRequest -Uri http://localhost:3001 -UseBasicParsing
Invoke-WebRequest -Uri http://127.0.0.1:8000/health -UseBasicParsing
```

Expected results:

- `npm run build` completes successfully.
- The web app returns HTTP 200.
- The OCR health endpoint returns `{"status":"ok"}`.
