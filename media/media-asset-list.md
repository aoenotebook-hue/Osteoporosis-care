# Media Asset List & Image Generation Prompts

Every media file to upload, and a ready-to-paste prompt for generating each
demonstration image.

**Two sections, and they are not the same:**

- **Part A — Exercises (17).** The app already renders these. Drop the file
  in, add one line to `MEDIA_MANIFEST`, and it appears.
- **Part B — Self-care (14).** The app has **no media slot for these yet**.
  The files are worth preparing, but they will not display until the Medicine,
  Track, Safety and Food tabs are given a media area. See "Wiring up Part B".

Filenames are not free choices in Part A: the key in `MEDIA_MANIFEST` must be
the exercise `id` from `EXERCISE_LIST`, and the convention is that the file is
named after it too. Keep them exactly as listed.

---

## Part A — Exercise media (17 exercises)

Put these in `media/exercises/`.

| # | Image file (required) | Video file (optional) | Exercise | Group | Levels |
|---|---|---|---|---|---|
| 1 | `sit_to_stand_hold.jpg` | `sit_to_stand_hold.mp4` | Sit-to-stand with support | balance | 1,2,3 |
| 2 | `standing_marching.jpg` | `standing_marching.mp4` | Standing marching | balance | 1,2,3 |
| 3 | `weight_shifts.jpg` | `weight_shifts.mp4` | Side-to-side weight shifts | balance | 1,2,3 |
| 4 | `single_leg_stand_chair.jpg` | `single_leg_stand_chair.mp4` | Single-leg stance | balance | 2,3 |
| 5 | `tandem_stand.jpg` | `tandem_stand.mp4` | Heel-to-toe stand | balance | 2,3 |
| 6 | `tandem_walk.jpg` | `tandem_walk.mp4` | Heel-to-toe walking | balance | 3 |
| 7 | `backward_walk.jpg` | `backward_walk.mp4` | Backward walking | balance | 3 |
| 8 | `sit_to_stand.jpg` | `sit_to_stand.mp4` | Sit-to-stand | strength | 1,2,3 |
| 9 | `heel_raises.jpg` | `heel_raises.mp4` | Heel raises | strength | 1,2,3 |
| 10 | `wall_pushups.jpg` | `wall_pushups.mp4` | Wall push-ups | strength | 1,2,3 |
| 11 | `hip_abduction.jpg` | `hip_abduction.mp4` | Standing hip abduction | strength | 1,2,3 |
| 12 | `step_ups.jpg` | `step_ups.mp4` | Step-ups | strength | 2,3 |
| 13 | `hip_hinge.jpg` | `hip_hinge.mp4` | Hip hinge | posture | 1,2,3 |
| 14 | `chin_tuck.jpg` | `chin_tuck.mp4` | Chin tuck | posture | 1,2,3 |
| 15 | `scapular_squeeze.jpg` | `scapular_squeeze.mp4` | Shoulder blade squeeze | posture | 1,2,3 |
| 16 | `safe_pickup.jpg` | `safe_pickup.mp4` | Picking things up safely | posture | 1,2,3 |
| 17 | `seated_row_band.jpg` | `seated_row_band.mp4` | Seated band row | posture | 2,3 |

**17 images minimum. 34 files if you also film every clip.**

The image doubles as the video poster, so you never need a separate poster
file. Start with the 17 images — the app is complete and useful with images
alone, and video can follow one exercise at a time.

### Adding them to the app

```js
// app-core.js — MEDIA_MANIFEST
var MEDIA_MANIFEST = {
  heel_raises:  { type: 'image', src: 'media/exercises/heel_raises.jpg' },
  sit_to_stand: { type: 'video', src: 'media/exercises/sit_to_stand.mp4',
                  poster: 'media/exercises/sit_to_stand.jpg' }
};
```

Nothing renders until the entry exists, so half-finished uploads never show a
broken box. Video: H.264, portrait 9:16, ≤15 s, no audio needed — the app
prints the Thai/English instructions itself.

---

## Part B — Self-care media (14 items)

Put these in `media/selfcare/`. **These do not display yet** — see below.

### Self-tests (2) — Track tab

| Image file | Video | What it shows |
|---|---|---|
| `test_chair_stand.jpg` | `test_chair_stand.mp4` | 30-second chair stand, done safely |
| `test_tug.jpg` | `test_tug.mp4` | Timed Up and Go, the 3-metre course |

### Medication technique (5) — Medicine tab

| Image file | Video | Medicine |
|---|---|---|
| `med_bisphosphonate_weekly.jpg` | — | Weekly tablet: upright, plain water, 30 minutes |
| `med_denosumab.jpg` | — | 6-monthly injection at hospital |
| `med_zoledronate.jpg` | — | Yearly infusion at hospital |
| `med_teriparatide.jpg` | `med_teriparatide.mp4` | Daily self-injection at home |
| `med_romosozumab.jpg` | — | Monthly injection at hospital |

`med_teriparatide` is the one medication clip genuinely worth filming —
patients inject it themselves every day.

### Home safety by room (5) — Safety tab

| Image file | Room | Checklist items |
|---|---|---|
| `safety_bedroom.jpg` | Bedroom | 4 |
| `safety_bathroom.jpg` | Bathroom | 5 |
| `safety_stairs.jpg` | Stairs | 4 |
| `safety_kitchen.jpg` | Kitchen | 4 |
| `safety_outdoors.jpg` | Outdoors | 3 |

One image per room rather than one per checklist item: 20 small images would
bury the checklist, while five "this is what good looks like" pictures give
the patient something to compare their own home against.

### Nutrition (2) — Food tab

| Image file | What it shows |
|---|---|
| `food_calcium.jpg` | Calcium-rich Thai foods |
| `food_vitamin_d.jpg` | Vitamin D sources |

**14 images, 3 optional videos.**

### Wiring up Part B

The Move tab is the only place that calls `getExerciseMedia()`. To show any of
Part B, each tab needs the same gated media pattern — roughly:

```js
var SELFCARE_MEDIA = {
  med_teriparatide: { type: 'image', src: 'media/selfcare/med_teriparatide.jpg' }
};
// then, wherever the section renders:
var media = SELFCARE_MEDIA[key];
if (media) html += '<img class="exercise-media" loading="lazy" src="' + esc(media.src) + '" alt="...">';
```

Roughly an hour's work across the four tabs, plus a test. Ask and I'll do it —
best done once you know which images you actually have.

---

# Image generation prompts

Each prompt is self-contained: copy one, paste it into your image tool, done.
No need to combine them with anything else.

**Everything in one list:** [`all-media-prompts.md`](all-media-prompts.md) has all
53 media files — every still, every clip and the two app icons — in filename
order with a complete prompt each. Use that if you want one place to work
through; the files below group the same prompts by topic instead.

**Video prompts:** [`video-prompts.md`](video-prompts.md) holds 10-second clip
prompts for the balance and posture exercises (batches 1 and 3), with a note on
why AI video is a much riskier bet than AI stills for demonstrating a movement.

**Generating them in bulk instead:** [`all-prompts-batch.txt`](all-prompts-batch.txt)
holds the same 31 prompts arranged as five paste-in-one-go batches, each with
instructions telling the tool to work in order, hold the style steady, and
name the files correctly. Paste one batch at a time and review it before
starting the next — see the note on batch size in that file.

**Why illustration rather than photographs.** Every prompt asks for a clean
medical illustration. Photorealistic AI images of older people tend to produce
mangled hands and subtly wrong joint angles — which in an exercise app is not a
cosmetic problem, it is the patient copying the wrong thing. Illustration is
also consistent across 31 images, avoids depicting an identifiable person, and
reproduces well on a cheap phone screen. If you prefer photographs, brief a
photographer against the "Notes for filming" column in
`osteo-video-clip-list.md` instead — do not generate them.

**Check every image before you ship it.** These prompts describe the correct
technique, but image tools get joint angles wrong. You are the orthopaedic
surgeon: if the back is rounded in the hip-hinge image, regenerate it.

---

## Part A prompts — exercises

### 1. `sit_to_stand_hold.jpg` — Sit-to-stand with support

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, wearing a comfortable long-sleeved pale blue top, loose dark trousers and flat non-slip shoes.

Scene: a sturdy wooden dining chair with armrests, placed on a plain floor in a simple home room.

Pose - this is the key teaching point: she is caught halfway through standing up, hips just lifting clear of the seat, knees partly straightened, weight already over her feet - not still sitting down.

FOOT POSITION IS CRITICAL AND MOST IMAGES GET IT WRONG: her feet are pulled BACK towards the chair so that her ankles sit DIRECTLY BENEATH HER KNEES, or even slightly behind them. The shins slope backwards, not forwards. Feet must never be out in front of the knees.

She started from the FRONT edge of the seat, feet flat and hip-width apart, torso leaning forward from the hips, and BOTH HANDS GRIPPING THE ARMRESTS and pushing down. Her back is straight, not rounded.

Camera: three-quarter front view from her left, at seated eye level, full body in frame including both feet, angled so the position of the feet under the knees is unmistakable.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background containing only the chair and floor.

Must be clearly visible: both hands on the armrests, the forward lean, the straight back, and both feet flat on the floor.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no gym equipment, exercise mats or yoga clothing; no young or athletic model; no walking frame or walking stick; do not show the movement being done incorrectly.

Aspect ratio 3:4 portrait.
```

### 2. `standing_marching.jpg` — Standing marching

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai man in his early 70s, short grey hair, wearing a comfortable short-sleeved pale blue polo shirt, loose dark trousers and flat non-slip shoes.

Scene: an ordinary low wooden dining chair, seen from behind, on a plain floor in a simple home room. The chair is SMALL in the frame and its back reaches only to his waist - it must not tower in front of him or hide his body.

Pose - this is the key teaching point: he stands BEHIND the chair with BOTH HANDS RESTING ON THE CHAIR BACK, and has lifted his right knee forward and up to roughly hip height, thigh close to horizontal, as if marching on the spot. His left foot is flat on the floor. His torso is completely UPRIGHT - not leaning forward over the chair or hunching.

THE RAISED KNEE MUST BE FULLY VISIBLE AND UNOBSTRUCTED. The whole point of the picture is the height of that knee lift, so the chair must not cross in front of the thigh, knee or shin at any point. Draw the raised leg entirely clear of the chair.

Camera: three-quarter view from his front-left, full body in frame including both feet, positioned so the raised thigh and knee read clearly against the plain background rather than against the chair.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background containing only the chair and floor.

Must be clearly visible: both hands on the chair back, the raised knee, and the upright posture.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no gym equipment, exercise mats or yoga clothing; no young or athletic model; do not show the movement being done incorrectly.

Aspect ratio 3:4 portrait.
```

### 3. `weight_shifts.jpg` — Side-to-side weight shifts

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, wearing a comfortable long-sleeved pale blue top, loose dark trousers and flat non-slip shoes. SEEN FROM BEHIND - the back of her head and back of her body face the viewer.

Scene: a sturdy wooden dining chair, on a plain floor in a simple home room.

Pose - this is the key teaching point, and it must be visibly happening rather than merely implied: she stands behind the chair holding its back with both hands, feet a clear SHOULDER-WIDTH apart. She has transferred her weight fully onto her LEFT leg. Show this three ways at once, or the picture says nothing:

1. Her HIPS AND PELVIS ARE SHIFTED SIDEWAYS to the left, clearly off centre, so her left hip sits out over her left foot.
2. Her LEFT LEG is straight and vertical and visibly carrying her, the left foot flat and firmly planted.
3. Her RIGHT FOOT IS LIGHT - the right heel lifted off the floor with only the toes still brushing it, the right leg relaxed and unloaded.

Her shoulders stay level and her torso stays upright - the movement comes from the hips shifting sideways, not from bending sideways at the waist.

Camera: straight-on view from directly BEHIND her at chest height, full body in frame with both feet clearly visible, chosen so the sideways hip shift and the lifted right heel are both obvious.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background containing only the chair and floor.

Must be clearly visible: the pelvis shifted sideways off centre, the loaded straight left leg, the lifted right heel with only the toe down, both hands on the chair back, and the level shoulders.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no gym equipment, exercise mats or yoga clothing; no young or athletic model; do not show the movement being done incorrectly.

Aspect ratio 3:4 portrait.
```

### 4. `single_leg_stand_chair.jpg` — Single-leg stance

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai man in his early 70s, short grey hair, wearing a comfortable short-sleeved pale blue polo shirt, loose dark trousers and flat non-slip shoes.

Scene: a sturdy wooden dining chair, on a plain floor in a simple home room.

Pose - this is the key teaching point: he stands BESIDE the chair, balancing on his left leg. His right foot is lifted just a few centimetres clear of the floor - a small lift, not a high knee raise. Only his FINGERTIPS rest lightly on the chair back: a light safety touch, not a grip. His body is tall and upright.

Camera: three-quarter front view, full body in frame, with the chair clearly within his arm's reach.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background containing only the chair and floor.

Must be clearly visible: the fingertips-only light touch on the chair, the foot lifted just off the floor, and the chair positioned within easy reach.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no gym equipment, exercise mats or yoga clothing; no young or athletic model; do not show him balancing with no support nearby; do not show the movement being done incorrectly.

Aspect ratio 3:4 portrait.
```

### 5. `tandem_stand.jpg` — Heel-to-toe stand

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, wearing a comfortable long-sleeved pale blue top, loose dark trousers and flat non-slip shoes.

Scene: a plain interior wall in a simple home room, plain floor.

Pose - this is the key teaching point: she stands SIDE-ON to the wall with her nearest hand's fingertips brushing it for safety. Her feet are in a straight heel-to-toe line: the HEEL of her front foot is placed directly in front of the TOES of her back foot, touching, both feet on one line as if on a tightrope. Her arms are held slightly out from her sides for balance and her body is tall and upright.

Camera: front three-quarter view, full body in frame, angled so the heel-to-toe foot placement is unmistakably clear on the floor.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background containing only the wall and floor.

Must be clearly visible: the two feet in a single straight heel-to-toe line, the fingertips near the wall, and the arms held slightly out.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no painted floor line or tape; no gym equipment, exercise mats or yoga clothing; no young or athletic model; do not show the movement being done incorrectly.

Aspect ratio 3:4 portrait.
```

### 6. `tandem_walk.jpg` — Heel-to-toe walking

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai man in his early 70s, short grey hair, wearing a comfortable short-sleeved pale blue polo shirt, loose dark trousers and flat non-slip shoes.

Scene: a clear stretch of floor in a simple home hallway, with a plain wall close by on his right within arm's reach.

Pose - this is the key teaching point: he is mid-stride walking heel-to-toe in a straight line. His front heel is coming down directly in front of the toes of his back foot, both feet on one line. His head is UP and his eyes look AHEAD along the hallway, not down at his feet. Arms are slightly out from his sides for balance.

Camera: front three-quarter view from slightly ahead of him, full body in frame, showing both the foot placement and his forward gaze.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background - hallway, wall and floor only, completely clear of obstacles.

Must be clearly visible: the heel landing just in front of the opposite toes, the eyes looking ahead rather than down, and the wall close enough to touch if needed.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no painted floor line or tape; no rugs, furniture or clutter in the walking path; no gym equipment or yoga clothing; no young or athletic model.

Aspect ratio 3:4 portrait.
```

### 7. `backward_walk.jpg` — Backward walking

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, wearing a comfortable long-sleeved pale blue top, loose dark trousers and flat non-slip shoes. A second figure - a younger adult family member - stands close beside and slightly behind her, one hand hovering near her back ready to steady her without touching.

Scene: a completely clear, empty home hallway with a plain wall alongside. Nothing on the floor at all.

Pose - this is the key teaching point: she is walking BACKWARDS with short, careful steps. The stepping foot reaches back with the TOES coming down first. Her posture is upright and her steps are visibly short, not long strides.

Camera: side view of the hallway, both figures full body in frame, the emptiness of the floor behind her clearly visible.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background - hallway, wall and floor only.

Must be clearly visible: the backward direction of travel, the toe-first foot contact, the short step length, the completely clear floor, and the companion standing ready nearby.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no rugs, furniture, cables or clutter anywhere on the floor; no gym equipment or yoga clothing; no young or athletic model as the patient.

Aspect ratio 3:4 portrait.
```

### 8. `sit_to_stand.jpg` — Sit-to-stand (no hands)

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai man in his early 70s, short grey hair, wearing a comfortable short-sleeved pale blue polo shirt, loose dark trousers and flat non-slip shoes.

Scene: a sturdy wooden dining chair on a plain floor in a simple home room.

Pose - this is the key teaching point: he is halfway through standing up from the FRONT edge of the chair seat with his ARMS FOLDED ACROSS HIS CHEST - he is not using his hands at all. Feet flat, hip-width apart, drawn back under his knees. His torso leans forward from the hips and his BACK IS STRAIGHT, not rounded. The movement looks slow and controlled.

Camera: side view from his left at seated eye level, full body in frame including both feet.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background containing only the chair and floor.

Must be clearly visible: the folded arms, the straight back, the forward lean from the hips, and both feet flat on the floor.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no hands touching the chair or thighs; no gym equipment, exercise mats or yoga clothing; no young or athletic model; do not show a rounded, hunched back.

Aspect ratio 3:4 portrait.
```

### 9. `heel_raises.jpg` — Heel raises

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, wearing a comfortable long-sleeved pale blue top, loose dark trousers and flat non-slip shoes.

Scene: a sturdy wooden dining chair on a plain floor in a simple home room.

Pose - this is the key teaching point: she stands behind the chair holding its back with both hands, and has risen UP ONTO HER TOES at the top of the movement - both heels clearly lifted well off the floor, weight on the balls of the feet. Her body is tall and straight from head to ankle, not leaning on the chair.

Camera: side view from her left, full body in frame, angled so the gap between her raised heels and the floor is unmistakable.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background containing only the chair and floor.

Must be clearly visible: both heels lifted high and clear of the floor, both hands on the chair, and the tall straight body line.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no gym equipment, exercise mats or yoga clothing; no young or athletic model; do not show her slumping or hanging her weight on the chair.

Aspect ratio 3:4 portrait.
```

### 10. `wall_pushups.jpg` — Wall push-ups

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai man in his early 70s, short grey hair, wearing a comfortable short-sleeved pale blue polo shirt, loose dark trousers and flat non-slip shoes.

Scene: a plain interior wall in a simple home room, plain floor.

Pose - this is the key teaching point: he faces the wall about an arm's length away, palms flat on the wall at SHOULDER HEIGHT and shoulder-width apart. His elbows are bent, bringing his chest towards the wall at the bottom of the movement. Critically, his BODY FORMS ONE STRAIGHT LINE from head through hips to heels - the hips do not sag forward and the bottom does not stick out. His heels stay down on the floor.

Camera: strict side view at chest height, full body in frame, chosen specifically so the straight head-to-heel body line is obvious.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background containing only the wall and floor.

Must be clearly visible: the straight line from head to heels, the hands flat on the wall at shoulder height, the bent elbows, and the heels down.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no sagging hips or arched back; no floor push-up position; no gym equipment, exercise mats or yoga clothing; no young or athletic model.

Aspect ratio 3:4 portrait.
```

### 11. `hip_abduction.jpg` — Standing hip abduction

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, wearing a comfortable long-sleeved pale blue top, loose dark trousers and flat non-slip shoes.

Scene: a sturdy wooden dining chair on a plain floor in a simple home room.

Pose - this is the key teaching point: she stands tall holding the chair back with one hand, and has lifted her right leg OUT TO THE SIDE, away from her body. The lifted knee is STRAIGHT and the TOES POINT FORWARD, not turned outward or upward. Her torso stays completely UPRIGHT and vertical - she does NOT lean her body to the opposite side to get the leg higher. The lift is modest, roughly 30 degrees.

Camera: straight-on front view at chest height, full body in frame with both feet visible.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background containing only the chair and floor.

Must be clearly visible: the toes pointing forward on the lifted leg, the straight knee, and the upright torso with no sideways lean.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no leaning of the trunk; no high leg lift; no gym equipment, exercise mats or yoga clothing; no young or athletic model.

Aspect ratio 3:4 portrait.
```

### 12. `step_ups.jpg` — Step-ups

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai man in his early 70s, short grey hair, wearing a comfortable short-sleeved pale blue polo shirt, loose dark trousers and flat non-slip shoes.

Scene: the BOTTOM step of an indoor home staircase with a solid handrail running up the wall alongside it.

Pose - this is the key teaching point: he is stepping up onto the FIRST step only - his right foot planted on the step, left foot still on the floor, mid-movement. One HAND IS FIRMLY ON THE HANDRAIL. His posture is upright and he is looking ahead, not down at his feet.

Camera: side view, full body in frame, with the handrail and the bottom step both clearly visible and the rest of the staircase rising behind him.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background containing only the stairs, handrail and wall.

Must be clearly visible: the hand gripping the handrail, that he is on the bottom step only, and his upright posture.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no gym step platform or aerobics box; no climbing high up the staircase; no gym equipment or yoga clothing; no young or athletic model.

Aspect ratio 3:4 portrait.
```

### 13. `hip_hinge.jpg` — Hip hinge

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, wearing a comfortable long-sleeved pale blue top, loose dark trousers and flat non-slip shoes.

Scene: plain floor in a simple home room, plain background wall.

Pose - this is the single most important detail in the whole set: she is bending forward by pushing her HIPS BACKWARDS while her knees stay only slightly bent. Her BACK IS PERFECTLY FLAT AND STRAIGHT LIKE A RULER from her tailbone to the top of her head, tilted forward at roughly 45 degrees. There is absolutely NO ROUNDING OR CURVE in her spine. Her neck continues the same straight line, so she looks at the floor a little ahead of her feet. Her arms hang relaxed or rest lightly on the fronts of her thighs. Feet hip-width apart, flat on the floor.

Camera: strict side profile at hip height, full body in frame, chosen specifically so the dead-straight spine is the most obvious thing in the picture.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background of floor and plain wall only.

Must be clearly visible: the ruler-straight flat back, the hips pushed backwards behind the heels, and the softly bent knees.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; absolutely no rounded, curved or hunched spine; no deep squat; no touching the toes; no gym equipment, exercise mats or yoga clothing; no young or athletic model.

Aspect ratio 3:4 portrait.
```

### 14. `chin_tuck.jpg` — Chin tuck

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai man in his early 70s, short grey hair, wearing a comfortable short-sleeved pale blue polo shirt. Head, neck, shoulders and upper chest only.

Scene: plain very light blue-grey background, no room detail.

Pose - this is the key teaching point: he sits tall and draws his CHIN STRAIGHT BACKWARDS horizontally towards his throat, as if making a gentle double chin. The movement is purely backwards along a level line - his head does NOT tip up and does NOT nod down, and his eyes stay LEVEL looking straight ahead. His neck lengthens and the back of his head moves up and back. His shoulders stay relaxed and down.

Camera: strict side profile of head, neck and shoulders, filling most of the frame, chosen specifically so the backward chin movement and the level eye line are both obvious.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb.

Must be clearly visible: the chin drawn horizontally back creating a soft double chin, the eyes level and facing forward, the long tall neck, and relaxed shoulders.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no head tilting up or down; no hand pushing the chin; no neck stretching to the side; no young or athletic model.

Aspect ratio 1:1 square.
```

### 15. `scapular_squeeze.jpg` — Shoulder blade squeeze

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, wearing a fitted long-sleeved pale blue top through which the shape of the shoulder blades can be read. Upper body from the head to the mid-back.

Scene: plain very light blue-grey background, no room detail.

Pose - this is the key teaching point: seen FROM BEHIND, she sits or stands tall with her arms relaxed by her sides, and squeezes her SHOULDER BLADES TOGETHER towards her spine, as though gently holding a pencil between them. Crucially her SHOULDERS STAY DOWN and are NOT shrugged up towards her ears - the neck stays long. Her chest opens and her upper back flattens.

Camera: view from directly behind, upper body filling the frame, chosen specifically so the two shoulder blades drawing together is clearly readable.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb.

Must be clearly visible: the shoulder blades drawn together towards the spine, the shoulders held DOWN and not shrugged, and the long relaxed neck.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no shrugged or raised shoulders; no arms lifted or bent up; no resistance band; no young or athletic model.

Aspect ratio 1:1 square.
```

### 16. `safe_pickup.jpg` — Picking things up safely

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, wearing a comfortable long-sleeved pale blue top, loose dark trousers and flat non-slip shoes.

Scene: a simple home room, plain floor, with a small light object - a folded cloth - on the floor beside a sturdy chair.

Pose - this is the key teaching point: she is picking the object up the SAFE way. She has come right up close to it and KNELT DOWN ON ONE KNEE, her back kept PERFECTLY STRAIGHT AND UPRIGHT with no rounding of the spine at all. One hand SUPPORTS HER WEIGHT ON HER FRONT THIGH while the other hand reaches down to lift the object. Her shoulders and hips face the same direction - her back is not twisted.

Camera: side view at low height, full body in frame, chosen so the straight back and the supporting hand on the thigh are both obvious.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background of floor, chair and plain wall only.

Must be clearly visible: kneeling on one knee, the completely straight back, the supporting hand on the thigh, and the object close to her body.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; do NOT show the wrong technique anywhere in the image - no bending from the waist with straight legs, no rounded spine, no twisting; no heavy or large object; no gym equipment or yoga clothing; no young or athletic model.

Aspect ratio 3:4 portrait.
```

*Note: the filming checklist suggests contrasting this with the wrong way. For
a still image inside the app, generate the correct technique only — a patient
scrolling quickly can copy whichever half they happen to look at. Save the
right-versus-wrong contrast for the video, where narration makes it safe.*

### 17. `seated_row_band.jpg` — Seated band row

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai man in his early 70s, short grey hair, wearing a comfortable short-sleeved pale blue polo shirt, loose dark trousers and flat non-slip shoes.

Scene: a sturdy wooden dining chair without armrests on a plain floor. A light green elastic resistance band runs forward from his hands and is anchored to a fixed point on the wall in front of him at CHEST HEIGHT.

Pose - this is the key teaching point: he sits TALL on the chair, feet flat on the floor, holding one end of the band in each hand. He pulls both ELBOWS BACK past his ribs, close to his sides, squeezing his shoulder blades together. Critically his TORSO STAYS UPRIGHT AND VERTICAL - he does NOT lean backwards to pull harder, and he does not round forward. His shoulders stay down, not shrugged.

Camera: side view at chest height, full body in frame, with the band's anchor point on the wall visible at chest height.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background of chair, wall and floor only.

Must be clearly visible: the band anchored at chest height, the elbows drawn back close to the body, the vertical upright torso, and the shoulders down.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no leaning back or rocking; no rowing machine or gym equipment; no yoga clothing; no young or athletic model.

Aspect ratio 3:4 portrait.
```

---

## Part B prompts — self-care

### 18. `test_chair_stand.jpg` — 30-second chair stand test

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, wearing a comfortable long-sleeved pale blue top, loose dark trousers and flat non-slip shoes. A second figure - a younger adult family member - stands nearby holding a phone, timing her.

Scene: a sturdy wooden dining chair WITHOUT armrests, positioned with its BACK FIRMLY AGAINST A WALL so it cannot slide. Plain floor in a simple home room.

Pose - this is the key teaching point: she is halfway through standing up from the MIDDLE of the chair seat with her ARMS FOLDED ACROSS HER CHEST, using no hands. Her back is straight and her feet are flat on the floor. The companion stands within arm's reach, watching her, ready to help.

Camera: side three-quarter view, both figures full body in frame, with the chair pressed against the wall clearly visible.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background of chair, wall and floor only.

Must be clearly visible: the chair back against the wall, the folded arms, the straight back, and the companion standing ready nearby with a timer.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no stopwatch face showing digits; no chair with armrests; no chair standing free in the middle of the room; no patient testing alone; no gym equipment or yoga clothing.

Aspect ratio 3:4 portrait.
```

### 19. `test_tug.jpg` — Timed Up and Go test

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai man in his early 70s, short grey hair, wearing a comfortable short-sleeved pale blue polo shirt, loose dark trousers and flat non-slip shoes. A second figure - a younger adult family member - stands to one side holding a phone, timing him.

Scene: a simple home room showing the whole test course at once: a sturdy chair with its back against a wall, a clear straight walking path of about three metres leading away from it, and a small floor marker cone at the far end to turn around.

Pose - this is the key teaching point: he has stood up from the chair and is walking at his normal comfortable pace along the clear path towards the turning marker, upright and looking ahead. The whole route between chair and marker is completely free of rugs, furniture and clutter.

Camera: wide side view of the whole course, showing the chair, the clear three-metre path, the turning marker and both figures.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background.

Must be clearly visible: the chair against the wall at one end, the turning marker at the other, the completely clear walking path between them, and the companion timing nearby.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, measurements, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no stopwatch face showing digits; no rugs, cables or furniture in the walking path; no running or hurrying; no gym equipment or yoga clothing.

Aspect ratio 4:3 landscape.
```

### 20. `med_bisphosphonate_weekly.jpg` — Weekly tablet

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, in comfortable home clothing, sitting UPRIGHT on a dining chair at a table in the early morning - soft daylight through a window behind her.

Scene: a simple table holding ONE TALL GLASS OF PLAIN CLEAR WATER, filled to the top, and a single small white tablet in her other hand. A simple round wall clock in the background shows an early morning time.

Pose - this is the key teaching point: she has just taken the tablet and sits with a completely UPRIGHT BACK, not reclining or slumping. The full glass of plain water is the most prominent object on the table.

Camera: front three-quarter view from across the table, upper body and tabletop in frame.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background.

Must be clearly visible: the single tablet, the full glass of plain clear water, her upright seated posture, and the morning light.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; absolutely NO coffee cup, tea cup, milk, juice or any other drink; no food or breakfast anywhere in the scene; no bed or lying down; no pill bottles with labels.

Aspect ratio 4:3 landscape.
```

### 21. `med_denosumab.jpg` — 6-monthly injection at hospital

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, sitting calmly and relaxed in a clinic chair with her sleeve rolled up. A Thai nurse in light blue scrubs stands beside her.

Scene: a clean, friendly, uncluttered hospital outpatient room.

Pose - this is the key teaching point: the nurse is giving a small SUBCUTANEOUS injection - a short fine needle at a shallow angle into the soft tissue of the patient's upper arm. The patient looks comfortable and unworried; this is a quick, routine, painless appointment.

Camera: three-quarter view of both figures from the waist up, close enough to see the injection site clearly.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background.

Must be clearly visible: the small syringe held at a shallow angle against the upper arm, the nurse's blue scrubs, and the patient's calm, relaxed expression.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no large or frightening needle; no blood; no intravenous drip, tubing or infusion stand; no anxious or pained expression; no hospital bed.

Aspect ratio 4:3 landscape.
```

### 22. `med_zoledronate.jpg` — Yearly infusion at hospital

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai man in his early 70s, short grey hair, sitting comfortably and relaxed in a reclining infusion chair, one arm resting on the armrest. A Thai nurse in light blue scrubs checks the drip beside him.

Scene: a calm, clean hospital day-treatment room. An intravenous drip bag hangs on a stand, its line running down to a small dressing on the back of the patient's hand. A glass of water sits on a side table within his reach.

Pose - this is the key teaching point: this is a slow, comfortable, once-a-year appointment lasting 15-30 minutes. He looks at ease, perhaps reading; the drip is unremarkable and the glass of water beside him is clearly visible, since drinking plenty of water matters before and after.

Camera: three-quarter wide view showing the patient, the drip stand and the water glass together.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background.

Must be clearly visible: the drip bag and line, the comfortable reclining chair, the glass of water within reach, and the relaxed unworried patient.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no hospital bed or ward; no monitors, wires or alarming medical machinery; no blood; no anxious or pained expression; no syringe.

Aspect ratio 4:3 landscape.
```

### 23. `med_teriparatide.jpg` — Daily self-injection at home

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, in comfortable home clothing, SITTING DOWN on a chair at home - seated, not standing, in case she feels light-headed.

Scene: a simple, calm home room. On the table beside her: a small pen-shaped injector device, and in the background a domestic refrigerator, indicating where the pen is kept between doses.

Pose - this is the key teaching point: she is calmly injecting herself with the pen device into the soft tissue of her ABDOMEN, just to the side of the navel, holding the pen at a shallow angle against a gently pinched fold of skin. Her expression is calm and matter-of-fact - this is an easy daily routine she is confident with.

Camera: three-quarter front view from the waist up, close enough that the pen and the injection site are clearly readable.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background.

Must be clearly visible: the pen injector held against the abdomen at a shallow angle, that she is seated, and the fridge in the background.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no visible long needle; no blood; no standing up while injecting; no anxious or pained expression; no hospital setting or nurse - this is done at home, alone.

Aspect ratio 4:3 landscape.
```

### 24. `med_romosozumab.jpg` — Monthly injection at hospital

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, sitting calmly in a clinic chair. A Thai nurse in light blue scrubs stands beside her holding TWO small pre-filled syringes, indicating that this monthly dose is given as two injections at the same visit.

Scene: a clean, friendly, uncluttered hospital outpatient room.

Pose - this is the key teaching point: the nurse is giving a shallow SUBCUTANEOUS injection into the patient's abdomen or upper arm, with the SECOND syringe clearly visible in her other hand or on a small tray beside her - two injections, one appointment, once a month. The patient looks comfortable and unworried.

Camera: three-quarter view of both figures from the waist up, positioned so both syringes are clearly visible.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and reassuring - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered background.

Must be clearly visible: TWO small syringes, the shallow injection angle, and the patient's calm relaxed expression.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no large or frightening needles; no blood; no intravenous drip or infusion stand; no anxious or pained expression; no hospital bed.

Aspect ratio 4:3 landscape.
```

### 25. `safety_bedroom.jpg` — A safe bedroom

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: no people - an empty room, shown as a "this is what good looks like" example.

Scene: a simple, tidy Thai bedroom set up safely for an older person. It must clearly show: a warm NIGHT LIGHT or bedside lamp switched on within easy reach of the pillow; a clear, completely unobstructed walking path from the bed to the door; a bed at a sensible height so the feet reach the floor when sitting on the edge; and a floor entirely free of loose rugs, cables and clutter. A pair of flat non-slip slippers sits neatly beside the bed.

Camera: wide room view from the doorway, showing the bed, the bedside table and the clear floor path together.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and inviting - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered interior.

Must be clearly visible: the lit bedside lamp within reach, the completely clear floor path, and the slippers beside the bed.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no loose rugs or mats; no trailing electrical cables; no clutter, boxes or shoes on the floor; no dark or gloomy lighting; no hospital equipment.

Aspect ratio 4:3 landscape.
```

### 26. `safety_bathroom.jpg` — A safe bathroom

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: no people - an empty room, shown as a "this is what good looks like" example.

Scene: a simple Thai bathroom set up safely for an older person. It must clearly show: a sturdy GRAB RAIL fixed to the wall beside the toilet and another in the shower area; a NON-SLIP MAT on the wet floor of the shower; a raised toilet seat height; a plastic SHOWER STOOL to sit on while washing; and bright, even lighting with no dark corners. The floor is dry elsewhere and completely clear.

Camera: wide room view from the doorway showing the toilet, the shower area and both grab rails together.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and inviting - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered interior.

Must be clearly visible: both wall-mounted grab rails, the non-slip mat, the shower stool, and the bright even lighting.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no wet or shiny puddled floor outside the shower; no loose towels or clutter on the floor; no dark corners; no hospital equipment; no bathtub with a high side to climb over.

Aspect ratio 4:3 landscape.
```

### 27. `safety_stairs.jpg` — Safe stairs

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: no people - empty stairs, shown as a "this is what good looks like" example.

Scene: an indoor home staircase set up safely for an older person. It must clearly show: a solid HANDRAIL running the full length of the stairs, firmly fixed and easy to grip; BRIGHT EVEN LIGHTING with a light switch at both the bottom and the top; a contrasting colour strip on the EDGE OF EACH STEP so the steps are easy to tell apart; and steps completely clear of any objects.

Camera: view from the bottom of the staircase looking up, showing the full run of the handrail, the step edges and the light switch.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and inviting - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered interior.

Must be clearly visible: the full-length handrail, the contrasting edge marking on every step, the bright lighting, and the completely clear steps.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no objects, boxes or shoes left on any step; no missing or broken handrail; no loose stair carpet; no dark or shadowy stairwell.

Aspect ratio 3:4 portrait.
```

### 28. `safety_kitchen.jpg` — A safe kitchen

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: no people - an empty kitchen, shown as a "this is what good looks like" example.

Scene: a simple Thai kitchen set up safely for an older person. It must clearly show: everyday items - plates, pans, rice cooker - stored on LOW AND MIDDLE SHELVES at between waist and shoulder height so nothing needs reaching up for; a dry, clean, non-slip floor; bright lighting over the worktop; and a sturdy chair or stool to sit on while preparing food. No step stool is needed anywhere.

Camera: wide room view showing the worktop, the accessible shelves and the clear floor together.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and inviting - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered interior.

Must be clearly visible: the everyday items stored within easy reach at waist-to-shoulder height, the high shelves left empty, the dry clear floor, and the sturdy seat.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no step stool, ladder or chair used for climbing; no heavy items stored high up; no wet or greasy floor; no trailing cables; no clutter on the floor.

Aspect ratio 4:3 landscape.
```

### 29. `safety_outdoors.jpg` — Safe outdoors

```
Clean medical instructional illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a Thai woman in her mid-70s, short grey hair, walking confidently and comfortably.

Scene: the entrance path of a Thai home in bright daylight. It must clearly show: a smooth, even, dry path with no broken or uneven paving; a sturdy HANDRAIL beside the entrance steps; good daylight with no deep shadows; and the path completely clear of hoses, pots, tools and leaf litter.

Pose - this is the key teaching point: she wears well-fitting CLOSED-HEEL SHOES with flat non-slip soles - clearly not loose sandals or flip-flops - and walks upright, looking ahead along the even path, one hand near the handrail as she approaches the steps.

Camera: three-quarter view showing her full body, her shoes, the even path and the handrail together.

Style: flat vector-style medical illustration with soft cel shading and clean confident outlines. Warm, calm and inviting - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb. Simple uncluttered outdoor scene.

Must be clearly visible: the closed-heel flat non-slip shoes, the handrail at the steps, the even unbroken dry path, and the clear ground.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no loose sandals, flip-flops, slippers or high heels; no wet, mossy or broken paving; no garden hoses, plant pots or tools on the path; no rain or poor light.

Aspect ratio 4:3 landscape.
```

### 30. `food_calcium.jpg` — Calcium-rich foods

```
Clean medical illustration of food for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: no people - an appetising flat-lay arrangement of calcium-rich foods familiar in Thailand, laid out on a plain light surface.

Scene: an attractive, clearly separated arrangement showing: a glass of milk and a small pot of plain yoghurt; a block of firm tofu; small whole dried fish and dried shrimp; canned sardines with soft edible bones; a bunch of dark leafy greens such as kale and Chinese cabbage; sesame seeds; and a serving of soy milk. Each item is distinct and easily recognisable, not overlapping or piled up.

Camera: top-down flat-lay view, everything evenly lit and in focus.

Style: flat vector-style illustration with soft cel shading and clean confident outlines, appetising and fresh. Warm and inviting - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb, with the foods in their own natural colours.

Must be clearly visible: each food item separate and individually recognisable, especially the tofu, the small dried fish and the dark leafy greens.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no supplement pills, tablets, capsules or supplement bottles; no packaged branded products; no cheese-heavy Western spread; no raw meat.

Aspect ratio 4:3 landscape.
```

### 31. `food_vitamin_d.jpg` — Vitamin D sources

```
Clean medical illustration for an osteoporosis self-care app used by Thai adults aged 65-85.

Subject: a split scene showing the two ways of getting vitamin D - no clutter, both halves equally weighted.

Scene: on one side, a Thai woman in her mid-70s sitting comfortably outdoors on a garden bench in gentle EARLY MORNING SUNLIGHT, forearms and lower legs uncovered, wearing a sun hat, relaxed and enjoying the warmth. On the other side, a flat-lay of vitamin D rich foods: oily fish such as mackerel and salmon, egg yolks, and mushrooms - each item separate and clearly recognisable.

Camera: a single balanced composition holding both halves, evenly lit.

Style: flat vector-style illustration with soft cel shading and clean confident outlines. Warm, calm and inviting - an encouraging patient handout, not a clinical diagram. Muted palette built on medium blue #1c5cab with a very light blue-grey background #eaf1fb, with the foods and sunlight in their own natural colours.

Must be clearly visible: the gentle low morning sun, the uncovered forearms and lower legs, the sun hat, and each food item individually recognisable.

Do not include, under any circumstances: ARROWS or motion lines of any kind, and no text, letters, numbers, captions, labels, watermarks or logos anywhere in the picture — the app prints its own instructions beside the image, so an arrow both duplicates them and looks wrong; no supplement pills, tablets, capsules or supplement bottles; no harsh midday sun or sunburn; no sunbathing in swimwear; no beach scene; no packaged branded products.

Aspect ratio 4:3 landscape.
```

---

## Checklist

- [ ] 17 exercise images → `media/exercises/`
- [ ] 17 exercise clips (optional) → `media/exercises/`
- [ ] 14 self-care images → `media/selfcare/`
- [ ] 3 self-care clips (optional) → `media/selfcare/`
- [ ] Each image checked by a clinician for correct technique
- [ ] `MEDIA_MANIFEST` updated for every exercise file added
- [ ] Part B rendering wired into the Medicine, Track, Safety and Food tabs
