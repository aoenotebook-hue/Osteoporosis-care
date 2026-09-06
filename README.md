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
| หน้าหลัก / Home | Bone condition and fall risk with what each means and what to do, the 10-year fracture risk card, a countdown ring to the next dose, due prompts and a safety tip |
| ยา / Medicine | The patient's own drug, picked from icon cards: next dose, how long they have been on it, doses received, course position for romosozumab, how to take it, missed doses, side effects, dental note, do-not-stop warning, and past medicines with their durations |
| อาหาร / Food | Yearly nutrition review and its calcium, vitamin D and protein recommendations, plus bulleted guides to where calcium and vitamin D come from and what to cut down |
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

### About the 10-year fracture risk (FRAX)

The card gathers everything the official FRAX calculator asks for — age,
sex, weight, height and BMI, a previous fracture from a small fall, a
parent who broke a hip, current smoking, regular steroid tablets,
rheumatoid arthritis, another illness that thins bone, three or more
alcoholic drinks a day, and the femoral neck T-score when a DXA has been
recorded. Anything the assessment already asked is carried over and shown
read-only rather than asked twice. The card links straight to the Thai
FRAX tool (`frax.shef.ac.uk`, country 57), and the two percentages that
come back are recorded, dated, and synced to the FractureRisk sheet.

The card then works in one of two modes, and never mixes them:

1. **The official result.** Once the doctor's two percentages are
   recorded, the card shows them under a green *"Result from the official
   FRAX calculator"*, exactly as entered.
2. **The app's own estimate**, used only while no official result exists.
   It appears under an amber *"The app's own estimate — not an official
   FRAX result"* banner, as a range rather than a single figure, with a
   "How this was worked out" panel showing the starting point, every
   multiplier applied, the total, and the source.

**FRAX itself is not and cannot be computed here.** Its coefficients are
licensed and unpublished, so no code in this repo reproduces them. The
estimate is a deliberately simple stand-in: a published population
baseline for the patient's age and sex, multiplied by a relative risk for
each factor present.

- **Where the multipliers come from:** the pooled relative risks in the
  meta-analyses behind FRAX (Kanis et al.) and, for bone density, the
  per-standard-deviation gradient of risk (Marshall et al.). The exact
  string shown on screen is in `FRAX_ESTIMATE_SOURCE`.

Applied naively, that model reads two to three times above FRAX — it put
a 74-year-old with a previous fracture, a parental hip fracture and a
femoral neck T-score of −2.6 at 55%, against roughly 20–25% from the real
tool. Three corrections bring it back into range, all following from the
fact that the baseline is a population *average* rather than a risk-free
person:

- **Each relative risk is rescaled against that average**
  (`rr / (1 + prevalence × (rr − 1))`). A published RR compares people
  who have the factor against people who do not; applying it whole to an
  average that already contains both counts the risk twice.
- **The T-score is judged against the average for that age**, not against
  a young adult. A 75-year-old with a T-score of −1.9 is typical of her
  age and gets no bone-density multiplier; a better-than-average scan
  lowers the estimate.
- **Stacked factors are pulled back** (combined multiplier raised to the
  power 0.75). Risks overlap — someone with a previous fracture likely
  also has thin bone — so multiplying them whole compounds the same
  frailty several times. A single factor is barely touched.

`t13_frax_medication` checks the result against published FRAX ranges for
three reference profiles, so the estimate cannot silently drift off by
multiples again.

- **What it still does not model:** competing mortality and the
  dose-response detail FRAX carries. It stays coarse, so the multiplier
  is capped (×8 major, ×12 hip), the probability is capped (90% / 70%),
  and the figure is always shown as a ±30% range rather than a point.
- **What most needs your review:** `FRAX_BASELINE_RISK` in
  `app-core.js`. Those age/sex baselines, and the `meanTScore` column
  beside them, are approximate figures for an Asian population.
  Replacing them with Thai epidemiology is the single change that would
  most improve the estimate, and the card says on screen that a doctor
  should check them first. The `prevalence` figures on `FRAX_FACTORS`
  are the second such guess and deserve the same look.

So the intended flow stays: fill in the details → open the FRAX site →
enter them → record the two percentages back in the app, which then
replaces the estimate with the real thing.

## Copy protection — what this does and does not do

The app blocks the everyday ways content leaves it: text selection, right-click,
the iOS long-press "Save Image" menu, dragging pictures out, Ctrl+C, the video
player's Download and picture-in-picture options, and printing to paper or PDF.
Form fields stay fully selectable so a patient can still fix a mistyped HN.

**This is friction, not protection.** Be clear-eyed about it before relying on it:

- **Screenshots cannot be blocked.** No web app or PWA can stop a screenshot —
  there is no browser API for it, on any platform. Only a native app can
  (`FLAG_SECURE` on Android; iOS can detect one after the fact but not prevent
  it). If blocking screen capture is a real requirement, it means shipping a
  native app, not a web app.
- **The page source is readable.** Every Thai string is in `app-core.js`, which
  the browser must download to run. Anyone can open developer tools and read it.
- **Images and video are ordinary URLs.** `media/exercises/heel_raises.jpg`
  fetched directly returns the picture, whatever the app does.
- **This repository is public.** The entire app, all its text, and every image
  can be downloaded by anyone from GitHub with no reliance on the app at all.
  Nothing in the browser changes that. If the content genuinely must not be
  redistributed, make the repository private first — that is the change that
  actually matters, and the copy deterrents in the app are cosmetic beside it.

So the deterrents are worth having — they stop a patient casually forwarding a
medication instruction into a chat app, which is the realistic risk — but they
are not a licensing or confidentiality control, and should not be described to
anyone as one.

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
Adherence, Nutrition, Bmd, FractureRisk. Same-day check-in, nutrition, BMD and
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
11. **The fracture-risk estimate** shown when no official FRAX result
   has been recorded uses approximate Asian baselines
   (`FRAX_BASELINE_RISK`). Review those figures, and decide whether you
   want the estimate shown to patients at all or only the official
   result — it is one `else if` in `renderFraxCard()`.

## Writing for patients

The app is read by people in their seventies and eighties, often on a
small screen, so the content follows a few rules the test suite enforces:

- No patient-facing string runs past 260 characters. Anything longer
  belongs in `LISTS` in `app-core.js`, rendered as bullets.
- Everyday words over medical ones: "กระดูกบาง" rather than
  "ภาวะมวลกระดูกต่ำ", "broken a bone in a small fall" rather than
  "fragility fracture". Where a clinical term has to appear (T-score),
  the sentence explains it.
- Both languages are written for the patient, not translated word for
  word from each other — `t1_i18n_parity` catches any string where the
  two are identical, which usually means one was never really written.

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
