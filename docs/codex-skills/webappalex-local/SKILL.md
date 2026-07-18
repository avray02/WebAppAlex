---
name: "webappalex-local"
description: "Project-specific local runner instructions for WebAppAlex and the Athletic Performance Vite app."
---

# WebAppAlex Local Runner

Use this project workflow when the user asks to open, launch, start, run, or
preview WebAppAlex locally.

## Default App

Launch the React/Vite app:

```text
apps/athletic-performance
```

Default URL:

```text
http://127.0.0.1:5173/
```

## Preferred Command

Use the user-scoped helper script:

```powershell
& "C:\Users\vraya\.codex\skills\webappalex-local\scripts\start-webappalex-local.ps1"
```

## Manual Fallback

If the helper script is unavailable:

```powershell
cd "C:\Users\vraya\Documents\5. Projets perso\WebAppAlex\apps\athletic-performance"
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

If port `5173` is busy and not serving the app:

```powershell
npm run dev -- --host 127.0.0.1 --port 5174
```

## Notes

- The static portal can be opened directly from `index.html`.
- Athletic Performance should be opened through Vite.
- The app uses Firebase when `VITE_FIREBASE_*` values exist in `.env.local`.
- Without Firebase variables, the app runs in demo mode.
