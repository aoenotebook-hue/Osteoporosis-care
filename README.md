# ดูแลกระดูกพรุน — Osteoporosis Care

A bilingual (Thai/English) osteoporosis self-care PWA. Lifelong and
risk-tier driven rather than calendar driven: registration → risk
assessment → daily/weekly habits → monthly check-in → yearly nutrition
review, all built around a **risk-tier + balance-level resolver**.

## Structure

- `index.html` — the app shell: eight tabs, forms, charts, and state in
  `localStorage` under `OSTEO_STATE`. No build step.
- `app-core.js` — pure, dependency-free logic and content shared by the
  browser and the Node test suite: the `CONTENT` TH/EN dictionary, the
  tier and balance-level resolvers, medication schedules and care
  information, the nutrition estimators, exercise/safety data, tracking
  helpers and sync queueing.
- `tests/t*.js` — regression suites, run with `node tests/run_all.js`.
- `apps-script/Code.gs` — Google Apps Script backend (`doPost`) writing
  to the Registrations / CheckIns / Falls / Adherence / Nutrition / Bmd
  sheets.
- `manifest.webmanifest`, `sw.js`, `icon.svg` — installability (Add to
  Home Screen) and offline app-shell caching.
- `media/osteo-video-clip-list.md` — filming checklist, and how to add a
  clip to the Move tab's media manifest.

## The eight tabs

| Tab | What it holds |
|---|---|
| หน้าหลัก / Home | Care level, balance level, a countdown ring to the next dose, due prompts, safety tip, and the data-sync panel |
| ยา / Medicine | The patient's own drug, picked from icon cards: next dose, what it does, how to take it, missed doses, side effects, dental note, do-not-stop warning, dose history |
| อาหาร / Food | Yearly nutrition review and its calcium, vitamin D and protein recommendations |
| ออกกำลัง / Move | Exercises scoped to the balance level, each with written how-to steps; information only, no logging |
| กันล้ม / Safety | 20-item home safety check with per-item icons; done items turn blue, outstanding ones stay highlighted |
| ติดตาม / Track | Spine and hip BMD, height, chair-stand, TUG, falls and adherence — each with a progression chart, a change-since-first chip and a table view |
| ความรู้ / Learn | The four explainer panels and the external reading list |
| ฉุกเฉิน / Urgent | Red flags as severity cards, each with the action to take, and one-tap hospital/1669 calling |

Every page ends with a footer naming the supervising doctor and the
hospital phone number, plus an "erase and start over" link that clears
this phone's data behind a confirmation (and warns first if anything is
still waiting to be sent).

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
- **Dose reminders** — from 7 days before the next dose the app shows a
  pop-up (once a day, not on every open), sends a phone notification
  where the browser allows it, and offers a calendar file carrying an
  alarm a week ahead and another on the day.

### About the phone reminder

Scheduled web push does not survive a closed tab on iOS, so it cannot be
relied on for a dose that is a week away. The app therefore uses three
layers: the in-app pop-up (always works when the app is opened), a
Notifications-API message (where the browser permits it), and the
**calendar file, which is the dependable one** — once added, the phone's
own calendar fires the alarm whether or not the app is running.

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
2. **Deploy → New deployment → Web app**, set **Execute as: Me** and
   **Who has access: Anyone** (not "Anyone with a Google account" — that
   redirects to a login page the app cannot follow), and copy the URL.
3. `WEBHOOK_URL` in `index.html` is already wired to the deployed URL,
   and `SHARED_TOKEN` is set to the same generated secret in both
   `index.html` and `Code.gs`. **The two must always match.**
4. Apps Script deployments are pinned to a code snapshot: after editing
   `Code.gs`, use **Deploy → Manage deployments → Edit → New version**.
   Saving alone does not update the live `/exec` URL.
5. Sheets are created automatically on first write. Same-day check-in,
   nutrition and BMD records merge into one row; a second fall on the
   same day is kept as a separate event; resent identical records are
   skipped.

### If data is not arriving in the sheet

The Home tab has a **"การส่งข้อมูลให้โรงพยาบาล"** panel showing how many
records are waiting, when the last successful send happened, and the
exact reason the last attempt failed, with a "try sending now" button.
Read that first — it names the problem.

The most common cause is a **token mismatch**: the deployed `Code.gs`
still has an older `SHARED_TOKEN` than `index.html`. Apps Script answers
that with `{"ok":false,"error":"invalid token"}` over **HTTP 200**, so
the panel will show `invalid token` while the records stay queued.
Fix it by copying the current `SHARED_TOKEN` into the script and
deploying a **new version** (step 4).

> This was also a real bug in the app until now: the old code treated any
> HTTP 200 as success, so a rejected record was dropped from the queue and
> lost. It now only clears a record once the backend confirms it stored it,
> and anything else stays queued with the reason recorded.

The sandbox this was built in blocks `script.google.com`, so the live
endpoint could not be called from here. The sync path itself was verified
against a stand-in backend covering both the rejection and the success
case.

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
8. **Your name in the footer** is set in `app-core.js` → `DOCTOR`:
   นพ.สรวุฒิ ธรรมยงค์กิจ / Dr. Sorawut Thamyongkit. The build plan listed
   the ธรรมยงค์กิจ vs. ธำรงค์กิจ spelling as an open decision — it is now
   confirmed as ธรรมยงค์กิจ, so reuse that across the other three apps.
9. **BMD entry** takes g/cm² plus an optional T-score per site. Confirm
   that copying these off the DXA report is what you want patients doing,
   rather than the values being entered by staff.

## Accessibility

- 19px base text, ≥48px tap targets, high-contrast blue palette.
- Chart colours were validated for colour-vision deficiency and contrast
  against the app surface; every chart also has a "view as table" twin
  so no value is available only as colour or hover.
- Verified end-to-end in headless Chromium (registration → assessment →
  all eight tabs → nutrition review → self-tests → fall logging →
  monthly check-in → BMD entry → reminders → reset) with zero console
  errors. A pass on real iPhone
  Safari and Android Chrome hardware is still needed before a pilot.
- No separate high-contrast mode in v1.
