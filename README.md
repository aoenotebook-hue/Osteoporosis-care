# ดูแลกระดูกพรุน — Osteoporosis Care

A bilingual (Thai/English) osteoporosis self-care PWA. Lifelong and
risk-tier driven rather than calendar driven: registration → risk
assessment → daily/weekly habits → monthly check-in → yearly nutrition
review, all built around a **risk-tier + balance-level resolver**.

## Structure

- `index.html` — the app shell: seven tabs, forms, charts, and state in
  `localStorage` under `OSTEO_STATE`. No build step.
- `app-core.js` — pure, dependency-free logic and content shared by the
  browser and the Node test suite: the `CONTENT` TH/EN dictionary, the
  tier and balance-level resolvers, medication schedules and care
  information, the nutrition estimators, exercise/safety data, tracking
  helpers and sync queueing.
- `tests/t*.js` — regression suites, run with `node tests/run_all.js`.
- `apps-script/Code.gs` — Google Apps Script backend (`doPost`) writing
  to the Registrations / CheckIns / Falls / Adherence / Nutrition sheets.
- `manifest.webmanifest`, `sw.js`, `icon.svg` — installability (Add to
  Home Screen) and offline app-shell caching.
- `media/osteo-video-clip-list.md` — filming checklist, and how to add a
  clip to the Move tab's media manifest.

## The seven tabs

| Tab | What it holds |
|---|---|
| หน้าหลัก / Home | Care level, balance level, today's medication status, safety tip, due prompts |
| ยา / Medicine | The patient's own drug: next dose, what it does, how to take it, missed doses, side effects, dental note, do-not-stop warning, dose history |
| อาหาร / Food | Yearly nutrition review + its calcium, vitamin D and protein recommendations, plus what to cut down |
| ออกกำลัง / Move | Exercises scoped to the balance level, each with written how-to steps; information only, no logging |
| กันล้ม / Safety | 20-item home safety check with per-item icons; done items turn blue, outstanding ones stay highlighted |
| ติดตาม / Track | Progression graphs for height, chair-stand, TUG, falls and adherence, plus the self-test timers and DXA date |
| ฉุกเฉิน / Urgent | Red flags as severity cards, each with the action to take, and one-tap clinic/1669 calling |

## The engine

- **Risk tier** — A (bone health), B (high fracture risk), C
  (post-fracture). Conflicting inputs always resolve to the most
  conservative tier.
- **Balance level** — 1 (always supported) → 3 (independent). It drops
  automatically after any fall. It only rises when *all* of: both
  self-tests pass the age/sex norm and the TUG threshold, the results
  are less than 90 days old, no fall in 4 weeks, and at least 4 weeks at
  the current level. (Daily exercise logging was removed, so the gate
  rests on the self-tests rather than session counts.)
- **Nutrition** — a yearly food-frequency review estimates daily
  calcium, vitamin D and protein, and turns the shortfall into a
  suggested supplement amount for that individual. Every result is
  labelled as an estimate to confirm with the doctor.

## Running the tests

```
node tests/run_all.js
```

## Running the app locally

Any static server, e.g. `python3 -m http.server 8080`, then open
`http://localhost:8080/index.html`. Service workers and the install
prompt need a real HTTP(S) origin, not `file://`.

## Deploying the backend

1. Create a Google Sheet, open **Extensions → Apps Script**, paste in
   `apps-script/Code.gs`.
2. **Deploy → New deployment → Web app** (Execute as: Me, Access:
   Anyone) and copy the Web App URL.
3. `WEBHOOK_URL` in `index.html` is already wired to the deployed URL,
   and `SHARED_TOKEN` is set to the same generated secret in both
   `index.html` and `Code.gs`. **The two must always match** — if you
   rotate the token, change it in both places.
4. Apps Script deployments are pinned to a code snapshot: after editing
   `Code.gs`, use **Deploy → Manage deployments → Edit → New version**.
   Saving alone does not update the live `/exec` URL.
5. Sheets are created automatically on first write. Same-day check-in
   measurements merge into one row; a second fall on the same day is
   kept as a separate event; resent identical records are skipped.
6. This sandbox's network policy blocks `script.google.com`, so the live
   webhook could not be tested from here — verify by registering once
   and checking that a row appears in `Registrations`.

## Deploying the app

Static hosting (e.g. GitHub Pages): `index.html`, `app-core.js`,
`manifest.webmanifest`, `sw.js`, `icon.svg` and `media/`.

## Before a real pilot (do not skip)

1. **Every Thai clinical string** — medication instructions, red flags,
   the do-not-stop and dental warnings, and the supplement figures —
   needs your clinical read-through. The content is a complete, careful
   v1 draft, not clinically validated copy.
2. **Supplement recommendations** are computed from a food-frequency
   estimate (with a background-diet baseline) and rounded to common
   tablet sizes. Confirm the baselines, targets and rounding steps match
   what you would actually prescribe.
3. **Medication list** covers the classes in the build plan. Trim or
   extend it to what is actually prescribed.
4. **Tier C is not split** into hip vs. spine in v1; any prior fragility
   fracture maps to Tier C.
5. **Self-tests** are offered to all tiers with an on-screen "have
   someone with you" warning, not gated to supervised-only.
6. **Icons are PNG-free** — the app ships an SVG icon. Add real
   192×192 and 512×512 PNGs before a production deploy for the best
   home-screen result on older iOS.
7. **Exercise media** — no clips ship yet, so no media areas render.
   See `media/osteo-video-clip-list.md`.

## Accessibility

- 19px base text, ≥48px tap targets, high-contrast blue palette.
- Chart colours were validated for colour-vision deficiency and contrast
  against the app surface; every chart also has a "view as table" twin
  so no value is available only as colour or hover.
- Verified end-to-end in headless Chromium (registration → assessment →
  all seven tabs → nutrition review → self-tests → fall logging →
  monthly check-in) with zero console errors. A pass on real iPhone
  Safari and Android Chrome hardware is still needed before a pilot.
- No separate high-contrast mode in v1.
