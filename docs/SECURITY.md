# Security: identity, audit trail, hosting and local data

Script version **2026-09-24.2**, upload protocol **3**. This file says what the
app and the Apps Script now enforce, what they cannot, and what is left for
the clinic to decide. Everything here is covered by `tests/t19`–`t22` against
synthetic records only.

## What was found, and what changed

| Finding | Change |
|---|---|
| The public `SHARED_TOKEN` let anyone post records for any `patientId`. | Each phone makes a random 256-bit key at registration. The script keeps only its SHA-256 in a **Devices** tab, bound to the HN, and writes a record only when the key sent with it belongs to the HN it names. The token stays, but only to filter stray traffic. |
| Daily records were merged by HN and date and overwritten in place (160 cm was rewritten as 999). | Nothing is overwritten any more. A change to a day's record is a **new row** with the next `version` and a `supersedes` link to the row before. Every accepted change, conflict and refusal from a genuine phone goes to an append-only **Audit** tab. 999 cm is refused outright, whoever sends it. |
| A registration of only token and HN was accepted. | Registrations and each record type have a strict schema: required fields, types, real calendar dates, identifier consistency (`hn` = `patientId`, the record's HN = the phone's HN), clinical ranges, and consent evidence. Unknown fields are refused. |
| Consent was a client-side boolean. | A registration must carry which notice was agreed to (`consentVersion`, a hash of the exact wording), when (`consentAt`) and in which language (`consentLang`). It is stored with the device that sent it and the server's receipt time. This is **evidence of consent, not proof of identity**; see "Identity" below. |
| The service worker deleted every cache on the origin, other apps' included. | It deletes only this app's own old caches (`osteo-care-*`). |
| Health data sat in `localStorage` on an origin shared with other apps, and responses had no anti-framing headers. | `vercel.json` sends `X-Frame-Options: DENY`, `frame-ancestors 'none'` and the rest (below) from the app's own origin, `osteoporosis-care.vercel.app`. On GitHub Pages, which cannot send headers, the app refuses to draw inside a frame. Moving patients to that origin is planned below. |

Kept as before: the formula neutralisation (`safeCell`), the 20,000-character
request cap, and the rule that the app removes a record from its queue only on
an explicit acknowledgement. That rule is now stricter: `ok: true` plus
`result.action`.

## The rules, in one place

The rules live in a block marked `submission rules` that is **identical** in
`app-core.js` and `apps-script/Code.gs`, and `t20` fails if the two copies
differ. The app runs them before it saves or queues a value. The script runs
them again because anyone can post to it.

| Record | Fields and limits |
|---|---|
| registration | `patientId` = `hn` (letters, digits, `-`, `/`; ≤ 20); `yearOfBirth` whole number, age 18–120; `age` within 1 of it; `sex` female/male; `consent` true; `consentVersion` a known notice; `consentAt` ISO time, within 400 days before and 2 days after now; `consentLang` th/en |
| checkin | at least one of: height 100–210 cm, chair stands 0–60, TUG 1–300 s, safety score 0–50, falls 0/1, missed doses 0/1, balance level 1–3, bone status, fall risk |
| falls | `injured` 0/1 (required), cause ≤ 200 characters |
| adherence | a known medication, dose number 1–5000 |
| nutrition | calcium 0–10000 mg, supplement 0–3000 mg, vitamin D 0–10000 IU, protein 0–1500 g (what the food-frequency answers can produce at their limit, not a plausible intake) |
| bmd | scan date 1990 onwards and not after the record date; spine/hip T −6 to +6 (at least one); `lowestT` must be the lower of them |
| frax | tool; weight 25–200 kg; height 100–210 cm; BMI must match weight and height; risks 0–100 %, hip ≤ major |

Every record: a real date from 2020-01-01 up to one day ahead of the script's
Bangkok date. The ranges are the app's own input limits (`t20` checks that),
so nothing a patient can type is refused. An out-of-range value is flagged
next to the field in the patient's language, and it is not saved.

## Identity: needs a clinic decision

The key proves that a record came from **the phone that registered the HN**.
It does not prove the person is that patient. The first phone to register an
HN holds it. If a stranger registers a real patient's HN first, the real
patient's phone is refused ("registered on another phone") until staff revoke
the stranger's device. The same reply also tells anyone who asks whether an HN
is enrolled. The consent tick has the same limit: it records what was agreed
to, not who agreed.

Closing that gap needs a step that happens outside the app. The options:

| Option | How it works | Staff work | Code needed |
|---|---|---|---|
| **A. Enrollment code** (recommended) | At the clinic, staff add a row to an `Enrollment` tab (HN plus a one-time 8-character code, valid 14 days) and give the patient the code on paper or by LINE. The app asks for it at registration, and the script binds the phone only if code and HN match; the code is then marked used. | One row per patient, at a visit they already make | A code field on the registration form and a check in `handleRegistration` (about a day, with tests) |
| **B. Staff approval** | Registrations and records are accepted but held as `pending` until staff tick `verified` in Devices after a phone call. | A call per patient, before data counts | A `verified` column; staff views filter on it |
| **C. SMS or e-mail one-time code** | The script sends a code to contact details the hospital already holds. | None day to day | A paid SMS gateway or hospital mail relay, plus contact data the script would have to see |
| **D. Keep first-come binding** | As now, plus a weekly look at `conflict` rows in Audit and `pending` rows in Devices. | A weekly check | None |

Until the clinic chooses, D is what runs. A and B also close the enrollment
check described above.

## Staff procedures

- **Current values.** In CheckIns, Nutrition, Bmd, FractureRisk and
  Registrations, the row with the highest `version` for a patient (and a day)
  is current. Lower versions are its history. Filter or sort on `version`, and
  don't edit or delete rows: the history is the audit trail.
- **A patient changes phones, or erased the app and registered again.** The
  new phone shows "registered on another phone", and a `pending` row appears in
  Devices. After confirming it is the patient, change the old phone's `status`
  from `active` to `revoked`. The new phone's queued records go through at its
  next send.
- **A lost phone, or a patient who withdraws.** Set the phone's `status` to
  `revoked`. A revoked phone cannot write, and cannot register its way back,
  even when no other phone holds the HN. To let the same phone back in,
  set its row to `active` again.
- **Refused records.** Audit rows with action `refused` show what a genuine
  phone sent and why it was refused. The phone keeps the record and shows the
  patient a note to tell staff.
- **Tabs named "… (before 2026-09-24.2)"** are the data from before this
  version, moved aside intact on first use. Review them, then archive them
  under the retention policy below.

## Limits

| Limit | Value | When reached |
|---|---|---|
| Requests per phone | 120 an hour, 500 a day | "rate limited, try later"; stays queued |
| Versions of one record per patient per day | check-in 30; nutrition, BMD, FRAX, falls 10; doses 1 | "too many changes for this date"; set aside on the phone |
| Registration attempts per HN | 10 a day | "busy, try again"; stays queued |
| New phones bound | 60 an hour | "busy, try again"; stays queued |
| Request size | 20,000 characters | "request too large" |

Counters use `CacheService`, which is best effort, and they are adjustable in
`LIMITS` in `Code.gs`.

## Hosting on a separate origin

`localStorage` belongs to an origin. GitHub Pages serves every site of the
account from one origin, `https://aoenotebook-hue.github.io`, so any other app
published there can read this app's `OSTEO_STATE`. GitHub Pages also cannot
send response headers.

The same repository already deploys to Vercel at
**`https://osteoporosis-care.vercel.app`**, an origin of its own. With
`vercel.json` it sends:

- `Content-Security-Policy`: the page's own policy plus
  `frame-ancestors 'none'` (a `<meta>` policy cannot carry that directive).
  `t21` holds the two in step.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: no-referrer`, a `Permissions-Policy` that turns off
  camera, microphone, location, payment and USB, and
  `Cross-Origin-Opener-Policy: same-origin`.
- `Cache-Control: no-cache` on the page, scripts and service worker, so
  updates arrive promptly.

`.vercelignore` keeps the script, tests and tools off the site. A custom
domain such as `app.easybone.org` would be another separate origin and works
the same way.

## Moving patients' local data (plan)

Patients who installed the app from GitHub Pages keep their history in that
origin's storage. A new origin starts empty, so the move needs an explicit,
one-time transfer:

1. **Make the new origin canonical.** Print the new address on clinic
   material and point easybone.org's link at it. New patients start there.
2. **Release a hand-over version on GitHub Pages.** On open it shows "the app
   has moved" and one button. The button opens the new origin, and the two
   pages exchange messages with `postMessage`, each checking the other's exact
   origin:
   - the new page asks;
   - the old page sends `OSTEO_STATE`, including the device key, so the HN
     stays bound to the patient with no staff step;
   - the new page stores it and replies with a SHA-256 of what it received;
   - only when that hash matches does the old page erase its own copy and
     caches.
   Nothing passes through a server.
3. **If the transfer cannot run** (another phone, a cleared browser), the
   patient registers again on the new origin, and staff revoke the old device
   as for a new phone. Data already sent to the sheet is unaffected; history
   kept only on the phone is lost.
4. **After a set period** (suggested: 90 days), replace the GitHub Pages site
   with a static "moved" page, and turn Pages off once visits stop.

## Retention

- **On the phone:** a record leaves the upload queue only when the script
  acknowledges it. Refused records stay on the phone, visible, until the
  patient or staff reset the app. The footer's reset erases everything,
  including the phone's key; after that, registering the same HN needs
  staff to revoke the old device, and the reset dialog says so. A stored
  profile no longer carries the shared token.
- **In the sheet:** the hospital's PDPA retention period applies to every tab,
  Audit and Devices included. **The clinic needs to set it.** A suggestion is
  the duration of care plus the period the hospital already uses for
  outpatient records. The "(before …)" tabs fall under the same rule. When a
  patient withdraws consent, staff mark their Devices rows `revoked`, and
  delete or anonymise their rows as the hospital's PDPA process requires.

## Redeploying and verifying

The backend is fixed only when the deployed script passes the probes:

1. Paste `apps-script/Code.gs` into the Apps Script editor, replacing
   everything. Set the project time zone to Bangkok.
2. **Deploy → Manage deployments → pencil icon → Version: New version →
   Deploy.**
3. Open the `/exec` URL. It must say `"version":"2026-09-24.2"` and
   `"protocol":3`.
4. From a computer with Node 18 or later, run
   `node tools/verify-backend.js <the /exec URL>`. The read-only probes send
   requests the script must refuse, and must all pass. If the version is
   wrong, the tool stops before sending anything that an older script would
   write. `--write` also runs a full round trip with two made-up `ZZTEST-`
   patients and prints the rows to delete.

Against the script as it was before this change, the same probes reproduce
the findings: a bare token-and-HN registration is accepted, 999 cm is
accepted, and one phone can merge into another patient's day (`t22`).

## What remains

- `SHARED_TOKEN` is public by design; the per-phone key carries the security.
- Identity is first-come until the clinic chooses an option above.
- Data on the phone is in plain `localStorage`. Anyone holding an unlocked
  phone can read it, as with any web app.
- Rate limits are per phone, and a stranger can make new keys. The
  new-phones-per-hour cap and the registration cap are what bound that.
  The per-HN registration cap can also be used up by a stranger for a day;
  the patient's phone then retries the next day.
- The reply "registered on another phone" tells anyone who asks whether an
  HN is enrolled. Options A and B close this.
