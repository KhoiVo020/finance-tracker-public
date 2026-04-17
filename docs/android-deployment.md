# Android Deployment

This project should be shipped to Android as a hosted PWA wrapped by a Trusted Web Activity (TWA). The Next.js server remains responsible for Server Actions, Prisma, AI parsing, and OCR calls; the Android app opens the production HTTPS site fullscreen.

## Target Shape

```text
Android TWA
  -> Hosted Next.js app
       -> Persistent database
       -> Hosted Python OCR API
```

## 1. Deploy the Next.js App

Use a Node-capable host. Static-only hosting will not work because the app uses Server Actions.

Set these environment variables on the host:

```env
NODE_ENV="production"
DEMO_MODE="true"
NEXT_PUBLIC_DEMO_MODE="true"
NEXT_PUBLIC_APP_URL="https://your-domain.example"
OCR_SERVICE_URL="https://your-ocr-service.example"
GEMINI_API_KEY=""
```

For a private app with persisted data, set demo mode to false and provide a database:

```env
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"
DATABASE_URL="postgresql://..."
```

Then run the normal production flow:

```powershell
npm install
npx prisma generate
npm run build
npm start
```

## 2. Deploy the OCR API

Deploy `python-ocr/main.py` as a separate HTTPS service. The Next.js app now reads its OCR API from `OCR_SERVICE_URL`, with local development defaulting to `http://127.0.0.1:8000`.

The hosted OCR API must expose:

```text
GET  /health
POST /scan-receipt
POST /scan-grocery-receipt
POST /process-image
```

After deployment, verify:

```powershell
Invoke-WebRequest -Uri https://your-ocr-service.example/health -UseBasicParsing
```

## 3. Verify PWA Metadata

After the Next.js app is deployed, confirm these URLs return successfully:

```text
https://your-domain.example/manifest.webmanifest
https://your-domain.example/icons/icon-192.png
https://your-domain.example/icons/icon-512.png
https://your-domain.example/icons/maskable-512.png
```

## 4. Generate the Android Wrapper

Install Bubblewrap:

```powershell
npm install -g @bubblewrap/cli
```

Initialize a TWA project from the hosted manifest:

```powershell
bubblewrap init --manifest https://your-domain.example/manifest.webmanifest
```

During setup, use your production host, package name, app title, icons, and release signing key. Bubblewrap will also guide the Digital Asset Links setup that proves the Android app and website are owned by the same publisher.

Build the Android artifact:

```powershell
bubblewrap build
```

Use the generated `.aab` for Google Play, or an `.apk` for direct device testing.

## 5. Required Web Verification

A production TWA needs Digital Asset Links on the web app:

```text
https://your-domain.example/.well-known/assetlinks.json
```

The file must include the Android package name and signing certificate fingerprint used for the release build. Bubblewrap can produce the values during setup.

Use `docs/assetlinks.template.json` as the starting point. Replace the package name and SHA-256 fingerprint, then publish the final file to:

```text
public/.well-known/assetlinks.json
```

## Notes

- Do not point the Android app at `localhost`; on a phone that means the phone itself, not your development machine.
- Keep `OCR_SERVICE_URL` HTTPS in production so file uploads and TWA verification work cleanly.
- If the hosted OCR API is down, the Next.js server now returns a configuration error instead of attempting to launch the local Windows OCR process.
