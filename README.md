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
| หน้าหลัก / Home | Bone condition and fall risk with what each means and what to do, the FRAX card, a countdown ring to the next dose, due prompts and a safety tip |
| ยา / Medicine | The patient's own drug, picked from icon cards: next dose, how long they have been on it, doses received, course position for romosozumab, how to take it, missed doses, side effects, dental note, do-not-stop warning, and past medicines with their durations |
| อาหาร / Food | Yearly nutrition review and its calcium, vitamin D and protein recommendations, plus where calcium and vitamin D come from and what to cut down |
| ออกกำลัง / Move | Exercises scoped to the balance level, each with written how-to steps; information only, no logging |
| กันล้ม / Safety | 20-item home safety check with per-item icons; done items turn blue, outstanding ones stay highlighted |
| ติดตาม / Track | Spine and hip T-scores, height, chair-stand, TUG, falls and adherence — each with a progression chart, a change-since-first chip and a table view, with past scan results listed at the bottom |
| ความรู้ / Learn | Explainer panels (what osteoporosis is, the T-score, who should be scanned, why medication matters, what to expect) and the reading list |
| ฉุกเฉิน / Urgent | Red flags as severity cards, each with the action to take, and one-tap hospital/1669 calling |

The header carries the patient's HN. Every page ends with a footer
naming the supervising doctor and an "erase and start over" link that
clears this phone's data behind a confirmation. When records are stuck in
the queue, a quiet line appears there with a retry button.

## The engine

Two separate judgements, because they are managed differently and mixing
them misleads the patient:

- **Bone condition** — a diagnosis, from bone density and fracture
  history *only*: unknown → normal (T ≥ -1.0) → thinning bone (between
  -1.0 and -2.5) → osteoporosis (T ≤ -2.5, or any fragility fracture) →
  osteoporosis with a fracture. A hip or spine fragility fracture counts
  as osteoporosis on clinical grounds whatever the scan says. Age,
  steroids and falls raise *risk* but never by themselves create this
  label. Recording a DXA result updates it, using the lowest T-score of
  the sites measured.
- **Chance of falling** — STEADI-style: high with two or more falls, any
  fall that caused injury, or a TUG of 12 seconds or more; moderate with
  one uninjured fall, unsteadiness, worry about falling, or a walking
  aid; otherwise low. Each grade carries its own management advice on
  the Home tab.
- **Balance level** — 1 (always supported) → 3 (independent), starting
  from the fall-risk grade. It drops automatically after any fall, and
  only rises when *all* of: both self-tests pass the age/sex norm and the
  TUG threshold, the results are less than 90 days old, no fall in 4
  weeks, and at least 4 weeks at the current level.
- **Nutrition** — a yearly food-frequency review estimates daily
  calcium, vitamin D and protein and turns each shortfall into a
  suggested supplement amount, labelled as an estimate to confirm with
  the doctor.
- **Dose reminders** — from 7 days before the next dose: a pop-up once a
  day, a phone notification where the browser allows it, and a calendar
  file with an alarm a week ahead and another on the day.

### About FRAX

**The app does not calculate a FRAX score, and should not.** The FRAX
coefficients are licensed by the University of Sheffield and are not
published, so any number computed offline would be a guess wearing a
clinical label.

What it does instead: it collects everything the official calculator
asks for (age, sex, weight, height and BMI, femoral-neck T-score from
the recorded scan, previous fracture, parent hip fracture, smoking,
glucocorticoids, rheumatoid arthritis, secondary osteoporosis, alcohol),
shows it as a worksheet, links to the official FRAX tool, and stores the
10-year major and hip percentages you read off it. The card says plainly
that the figures came from the calculator, not from the app.

If you want a computed score inside the app, the licensed options are a
FRAX API agreement with Sheffield, or an openly published model such as
QFracture or Garvan — tell me which and I will wire it in.

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

`apps-script/Code.gs` is self-contained — paste the whole file in,
replacing anything already there.

1. Open your Google Sheet → **Extensions → Apps Script**.
2. Select everything in the editor, delete it, paste in `Code.gs`, save.
3. **Deploy → Manage deployments → pencil icon → Version: New version →
   Deploy.** This step is the one that matters: saving alone does **not**
   change what the live `/exec` URL runs, so an older copy of the script
   keeps answering.
4. Confirm it took: open the `/exec` URL in a browser. It answers

   ```json
   {"ok":true,"service":"osteoporosis-care","version":"2026-09-05","tokenConfigured":true,"sheets":[...]}
   ```

   If `version` is not the one in the file you just pasted, step 3 did
   not take effect.

Access must be **Anyone**, not "Anyone with a Google account" — the
latter answers with a login page the app cannot follow. `SHARED_TOKEN`
must be identical in `Code.gs` and `index.html`.

Sheets are created on first write: Registrations, CheckIns, Falls,
Adherence, Nutrition, Bmd, Frax. Same-day check-in, nutrition, BMD and
FRAX records merge into one row; a second fall on the same day is kept
as a separate event; an exact repeat is skipped.

### If data still does not arrive

Records that are not accepted stay queued and a line appears in the page
footer with a retry button — nothing is silently dropped. The likely
causes, in order:

1. **The script was never redeployed** (step 3). Check the version with
   the `/exec` URL as above. This is the most common one.
2. **Token mismatch** — the script answers `invalid token` with HTTP 200.
3. **Access set to "Anyone with a Google account"**.

This sandbox blocks `script.google.com`, so the live endpoint cannot be
called from here. The client sync path is verified against a stand-in
backend covering both the accepted and rejected cases.

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
4. **The classification thresholds** — T ≥ -1.0 normal, -2.5 osteoporosis,
   hip/spine fragility fracture as clinical osteoporosis, and the STEADI
   fall-risk cut-offs — are the standard ones, but confirm they match
   your practice.
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
9. **BMD entry** takes the spine and hip T-scores off the DXA report, and
   the lowest of them updates the bone status. Confirm you want patients
   entering these themselves rather than staff.
10. **The BMD screening criteria** in the Learn tab follow common
   international guidance; confirm them against the Thai guideline you
   use before the pilot.

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
