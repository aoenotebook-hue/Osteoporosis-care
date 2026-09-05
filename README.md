# ดูแลกระดูก — Bone Health Companion

Osteoporosis self-care PWA for CNMI Ramathibodi Orthopaedic Surgery
patients — the 4th app in the CNMI suite. Lifelong, risk-tier driven
(no end date): onboarding risk profile → daily/weekly habits → monthly
check-in, built around a **risk-tier + balance-level resolver** engine,
matching the pattern used by the ACL and frozen-shoulder apps.

## Structure

- `index.html` — the app shell: UI, tabs, forms, state (`localStorage`
  under `OSTEO_STATE`), rendered from `app-core.js` data/logic. Single
  page, no build step.
- `app-core.js` — pure, dependency-free logic and content shared by the
  browser (`<script src="app-core.js">`) and the Node test suite
  (`require('./app-core.js')`): the `CONTENT` TH/EN dictionary, the
  tier/balance-level resolvers, medication schedule math, calcium
  table, exercise/safety/tracking data, and sync helpers.
- `tests/t*.js` — one regression suite per build step (see below), run
  with `node tests/run_all.js`.
- `apps-script/Code.gs` — Google Apps Script backend (`doPost`) for the
  Registrations / CheckIns / Falls / Adherence / Exercise sheets.
- `manifest.webmanifest`, `sw.js`, `icon.svg` — installability (Add to
  Home Screen) and offline app-shell caching.
- `media/osteo-video-clip-list.md` — filming checklist for the Move-tab
  exercise clips.

## Running the tests

```
node tests/run_all.js
```

Each `tests/tN_*.js` corresponds to a build-plan step's test gate
(i18n parity, webhook payload shape, tier engine, medication schedule
math, calcium table, exercise scoping, safety score, tracking, resource
rendering, sync dedup).

## Running the app locally

Any static file server works, e.g.:

```
python3 -m http.server 8080
```

then open `http://localhost:8080/index.html`. Service workers and
`beforeinstallprompt` require a real HTTP(S) origin (not `file://`).

## Deploying the backend

1. Create a Google Sheet, open **Extensions → Apps Script**, paste in
   `apps-script/Code.gs`.
2. Set `SHARED_TOKEN` in `Code.gs` to a private random string.
3. **Deploy → New deployment → Web app** (Execute as: Me, Access:
   Anyone), copy the Web App URL.
4. In `index.html`, set `WEBHOOK_URL` to that URL and `SHARED_TOKEN` to
   the same string as step 2.
5. Sheets (`Registrations`, `CheckIns`, `Falls`, `Adherence`,
   `Exercise`) are created automatically on first write.

Until `WEBHOOK_URL` is set, the app runs fully offline and queues
registration/records in `syncQueue` for later flushing.

## Deploying the app

Static hosting (e.g. GitHub Pages) — the app is `index.html` +
`app-core.js` + `manifest.webmanifest` + `sw.js` + `icon.svg`, no build
step required.

## Before a real pilot (do not skip)

These were flagged as open decisions in the build plan and were
resolved with the most conservative / simplest default for v1 — they
still need the clinical owner's sign-off:

1. **Tiers**: Tier C is not split hip vs. spine in v1 (deferred to
   "later phases" per the plan); any prior fragility fracture site
   maps to Tier C.
2. **Calcium wording**: shown as both an mg total and a progress bar
   (not a 3-tick scale) — confirm this is the preferred presentation.
3. **Medication list**: limited to the classes named in the plan
   (weekly/daily bisphosphonate, denosumab, zoledronate, teriparatide,
   romosozumab, calcium+vitamin D) — trim/extend to what CNMI actually
   prescribes.
4. **Owner's surname spelling**: `ธรรมยงค์กิจ` is used as given in the
   plan header — confirm before reuse across the other three apps.
5. **Self-tests**: the 30-second chair-stand and TUG timers are shown
   to all tiers with an on-screen "someone nearby" safety warning, not
   gated to supervised-only — confirm this is acceptable for Tier C.
6. **Every Thai clinical string** (medication instructions, red flags,
   safety copy) needs a native-speaker clinical read-through before
   real patient use — content here is a structurally complete v1
   draft, not clinically validated copy.
7. **Branding**: the header currently has a placeholder box where the
   real CNMI wordmark/logo image should go — no logo asset was
   fabricated. Also add real 192×192 / 512×512 PNG icons (currently a
   generic SVG placeholder) before a production deploy.

## Accessibility notes (Step 12 pass)

- Base body font is 19px (Thai/English), buttons and tap targets are
  ≥48px per the plan's older-user accessibility bar.
- Verified with a headless Chromium smoke test (registration →
  onboarding → all six tabs → key interactions) with zero console
  errors; a manual pass on real iPhone Safari / Android Chrome
  hardware (A2HS flow, font legibility, timer accuracy) is still
  needed before pilot, per the plan's Step 12 device-testing checklist.
- A high-contrast theme toggle was not implemented in v1 — colours use
  WCAG-conscious contrast but there is no separate high-contrast mode.
