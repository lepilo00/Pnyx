---
name: verify
description: Build, launch, and observe this app (React+Vite SPA) to verify changes end-to-end at the browser surface.
---

# Verifying changes in this repo

React 19 + Vite 8 SPA (react-router v7, i18next, Tailwind). No Playwright/Puppeteer installed — use system headless Chrome.

## Build / launch

```bash
npm run build            # tsc -b && vite build (typecheck + bundle)
npm run dev              # Vite dev server on http://localhost:5173 (run_in_background)
```

Server is ready in <1s; check the task output file for "VITE ... ready".

## Drive the running app (headless Chrome)

Chrome lives at `/c/Program Files/Google/Chrome/Application/chrome.exe`.
SPA renders client-side, so `curl` is useless — use `--dump-dom` (renders JS) or `--screenshot`.

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
# Rendered DOM (grep for headings, links, strings):
"$CHROME" --headless=new --disable-gpu --dump-dom --virtual-time-budget=5000 "http://localhost:5173/about" > out.html
# Screenshot (mobile-ish column; page is max-w-lg centered):
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=5000 \
  --window-size=800,1500 --screenshot="C:\\...absolute path...\\shot.png" "http://localhost:5173/"
```

Gotchas:
- `--screenshot=relative.png` fails with "Access is denied" — pass an **absolute Windows path** into the scratchpad.
- Narrow `--window-size` (≤420) produces horizontally clipped captures; 800px wide is reliable (content column is max-w-lg anyway).
- Language is chosen only via localStorage key `dw-locale` (no URL param). To drive a non-default locale headlessly, create a **temporary** `public/__setlang.html` with `<script>const p=new URLSearchParams(location.search);localStorage.setItem('dw-locale',p.get('lng')||'en');location.replace(p.get('to')||'/')</script>` and navigate to `http://localhost:5173/__setlang.html?lng=sl&to=/stop/<id>` — delete the file afterwards. Also validate all locale JSONs (en, fr, es, de, zh, el, sl) with a node key-diff against en.json.
- Stop pages need real Supabase UUIDs in the URL (`/stop/<uuid>`); fetch them read-only: `curl "$VITE_SUPABASE_URL/rest/v1/stops?select=id,order_index&is_published=eq.true" -H "apikey: $VITE_SUPABASE_ANON_KEY"` (values in `.env`).

## Flows worth driving

- `/` landing (hero, teaser cards, footer), `/start`, `/stop/1`, `/about`, `/privacy`.
- Footer links render on every page via `src/components/Layout.tsx`.
- Unknown routes redirect to `/` (catch-all in `src/App.tsx`).
- Supabase-backed pages (admin, signup form) need env/network — verify around them.
