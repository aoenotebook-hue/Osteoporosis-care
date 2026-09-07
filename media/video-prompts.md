# 10-Second Video Prompts — Batch 1 (Balance) and Batch 3 (Posture)

Twelve clips: seven balance exercises, five posture exercises. Companion to
`media-asset-list.md`, which holds the still-image prompts.

> **Looking for the strength clips, the self-care clips or the app icons?**
> They are in [`all-media-prompts.md`](all-media-prompts.md), which lists all
> 53 media files in filename order. This file covers batches 1 and 3 only.

## Read this before generating anything

**AI video is far less reliable than AI stills for this job.** The images
worked because a single frame either has a flat back or it does not. Over ten
seconds of motion, current video models morph limbs, bend joints the wrong way,
grow and lose fingers, and drift the body out of the pose they started in. In a
medical exercise demonstration that is not a cosmetic glitch — it is the
patient copying a movement that no human skeleton performs.

Two consequences:

1. **Review every clip frame by frame, not just play it once.** A clip that
   looks fine at speed often has three frames where the knee inverts.
2. **Filming a real person is a serious alternative here**, in a way it was not
   for the stills. `osteo-video-clip-list.md` is already a filming checklist
   with the camera angle for each exercise. A physiotherapist and a phone on a
   tripod, in an afternoon, gives you twelve clips that are anatomically
   correct by construction.

Generate these if your tool is good; do not force it if the first two come back
with melting limbs.

## Use the approved still as the first frame

If your tool supports image-to-video, **start each clip from the still image you
already approved** for that exercise. This is the single most useful thing you
can do:

- The style matches the rest of the app automatically — same line weight, same
  palette, same figure.
- Frame 1 is already the clinically correct pose, so the model animates from
  something right rather than inventing its own starting position.
- It stops the drift into photorealism that would leave your Move tab a mix of
  illustration and video.

Where a prompt below says "the subject", the still supplies who that is.

## Format

| | |
|---|---|
| Length | 10 seconds |
| Aspect | 9:16 portrait |
| Audio | none — the app prints the Thai and English instructions itself |
| Codec | H.264 `.mp4` |
| Filename | the exercise id, e.g. `tandem_walk.mp4`, in `media/exercises/` |

The still keeps its filename and becomes the video's poster frame, so nothing
already uploaded is wasted:

```js
tandem_walk: { type: 'video', src: 'media/exercises/tandem_walk.mp4',
               poster: 'media/exercises/tandem_walk.jpg' }
```

---

# Batch 1 — Balance (7 clips)

## 1. `sit_to_stand_hold.mp4` — Sit-to-stand with support

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai woman in her mid-70s, pale blue long-sleeved top, dark trousers, flat non-slip shoes, on a sturdy wooden dining chair with armrests in a plain home room.

CAMERA: completely locked off and motionless for the whole 10 seconds. Three-quarter front view from her left, at seated eye level, full body and both feet in frame. No pan, no zoom, no dolly, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat:
0.0-1.0s  Seated at the front edge of the chair, feet flat and pulled back so her ankles sit directly beneath her knees, both hands gripping the armrests. Still.
1.0-2.0s  She leans forward from the hips, back straight, nose travelling towards her toes.
2.0-4.5s  She pushes through her hands and legs and rises slowly to full standing. Slow and even — no jerk, no bounce, no momentum swing.
4.5-5.5s  Standing tall, hands still resting on the armrests. Brief pause.
5.5-8.5s  She lowers herself back down under full control, bending at hips and knees, still holding the armrests. The descent is as slow as the rise — she does not drop into the seat.
8.5-10.0s Seated again in exactly the starting position, still.

The clip must LOOP CLEANLY: the last frame matches the first frame.

Throughout, the following must never break: both hands stay on the armrests, the back stays straight and never rounds, the feet stay flat and stay under the knees, and the tempo stays slow and deliberate — the pace of a careful 75-year-old, not an athlete.

ANATOMY: the body must stay one consistent person for all 10 seconds. Limbs must not morph, stretch, swap length or change count. Knees and elbows bend only in the directions human joints bend. Hands keep five fingers. The face stays the same face.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions. No gym setting or athletic clothing.

10 seconds, 9:16 portrait.
```

## 2. `standing_marching.mp4` — Standing marching

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai man in his early 70s, pale blue polo shirt, dark trousers, flat non-slip shoes, standing behind a low wooden dining chair in a plain home room. The chair is small in frame, its back only at his waist, and never crosses in front of his raised leg.

CAMERA: completely locked off and motionless for the whole 10 seconds. Three-quarter view from his front-left, full body and both feet in frame, positioned so the raised knee reads clearly against the plain background. No pan, no zoom, no dolly, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — four slow marching steps:
0.0-1.0s  Standing upright behind the chair, both hands resting on the chair back, both feet flat.
1.0-2.2s  He lifts his RIGHT knee forward and up until the thigh is close to horizontal, at hip height.
2.2-3.2s  He lowers the right foot back to the floor with control.
3.2-4.4s  He lifts his LEFT knee to the same height.
4.4-5.4s  He lowers the left foot.
5.4-6.6s  RIGHT knee again, same height.
6.6-7.6s  Lower.
7.6-8.8s  LEFT knee again.
8.8-10.0s Lower, returning to the exact starting stance. Still.

The clip must LOOP CLEANLY: the last frame matches the first frame.

Throughout, the following must never break: both hands stay on the chair back, the torso stays completely upright and never leans forward over the chair or hunches, the supporting foot stays flat, and each knee rises to roughly hip height — the height of the lift is the whole point of the clip and must be clearly visible.

ANATOMY: the body must stay one consistent person for all 10 seconds. Limbs must not morph, stretch, swap length or change count. Knees and elbows bend only in the directions human joints bend. Hands keep five fingers. The face stays the same face.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions. No marching on the spot at speed — this is slow and deliberate.

10 seconds, 9:16 portrait.
```

## 3. `weight_shifts.mp4` — Side-to-side weight shifts

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai woman in her mid-70s, pale blue long-sleeved top, dark trousers, flat non-slip shoes. SEEN FROM BEHIND, standing behind a sturdy wooden dining chair in a plain home room, holding the chair back with both hands, feet a clear shoulder-width apart.

CAMERA: completely locked off and motionless for the whole 10 seconds. Straight-on view from directly behind her at chest height, full body and both feet in frame. No pan, no zoom, no dolly, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — one shift to each side, with the full three-second hold:
0.0-1.0s  Standing centred, weight even, both feet flat.
1.0-2.0s  Her HIPS AND PELVIS travel sideways to her LEFT, clearly off centre, until her left hip sits out over her left foot. Her RIGHT HEEL lifts off the floor, only the right toes still brushing it.
2.0-5.0s  She HOLDS there for a full three seconds. The pelvis stays off centre to the left, the left leg straight and loaded, the right heel clearly lifted.
5.0-6.0s  She returns smoothly to centre, both feet flat.
6.0-7.0s  Her hips travel sideways to her RIGHT, the left heel lifting, only the left toes touching.
7.0-10.0s She HOLDS there for a full three seconds, then begins returning to centre so the final frame is the centred starting stance.

The clip must LOOP CLEANLY: the last frame matches the first frame.

Throughout, the following must never break: both hands stay on the chair back, the shoulders stay LEVEL, and the movement comes from the hips travelling sideways — she must never bend sideways at the waist to fake it. The unloaded heel must be visibly off the floor during each hold, and the weight transfer must be plainly visible rather than implied.

ANATOMY: the body must stay one consistent person for all 10 seconds. Limbs must not morph, stretch, swap length or change count. Knees and elbows bend only in the directions human joints bend. Hands keep five fingers.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions.

10 seconds, 9:16 portrait.
```

## 4. `single_leg_stand_chair.mp4` — Single-leg stance

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai man in his early 70s, pale blue polo shirt, dark trousers, flat non-slip shoes, standing beside a sturdy wooden dining chair in a plain home room.

CAMERA: completely locked off and motionless for the whole 10 seconds. Three-quarter front view, full body in frame, with the chair clearly within his arm's reach. No pan, no zoom, no dolly, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — this exercise IS a ten-second hold, so the clip is almost entirely stillness:
0.0-1.0s  Standing tall beside the chair, both feet flat, only his FINGERTIPS resting lightly on the chair back — a light safety touch, never a grip.
1.0-2.0s  He lifts his RIGHT foot just a few centimetres clear of the floor. A small lift, not a knee raise.
2.0-9.0s  He HOLDS the single-leg balance for seven seconds. He is not frozen: allow small, natural, believable balance corrections — a slight ankle sway, a small shift at the hip, the fingertips brushing the chair a little more firmly for a moment and then easing off again. He stays composed and in control throughout.
9.0-10.0s He lowers the right foot back to the floor, returning to the starting stance.

The clip must LOOP CLEANLY: the last frame matches the first frame.

Throughout, the following must never break: the contact with the chair stays FINGERTIPS ONLY and never becomes a grip or a lean, the lifted foot stays only a few centimetres off the floor, the body stays tall and upright, and he never stumbles, wobbles violently or looks unsafe — this is a confident, controlled hold that a patient should feel able to copy.

ANATOMY: the body must stay one consistent person for all 10 seconds. Limbs must not morph, stretch, swap length or change count. The standing leg must stay a normal straight leg. Hands keep five fingers. The face stays the same face.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions. No falling, stumbling or near-fall.

10 seconds, 9:16 portrait.
```

## 5. `tandem_stand.mp4` — Heel-to-toe stand

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai woman in her mid-70s, pale blue long-sleeved top, dark trousers, flat non-slip shoes, standing side-on to a plain interior wall in a simple home room.

CAMERA: completely locked off and motionless for the whole 10 seconds. Front three-quarter view, full body in frame, angled so the heel-to-toe foot placement on the floor is unmistakable throughout. No pan, no zoom, no dolly, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — this exercise IS a ten-second hold:
0.0-1.5s  From a normal stance she places one foot forward into the heel-to-toe line: the HEEL of the front foot directly in front of the TOES of the back foot, touching, both feet on a single straight line as if on a tightrope. Her nearest hand's fingertips brush the wall for safety.
1.5-9.0s  She HOLDS the heel-to-toe stand, arms held slightly out from her sides for balance. Not frozen: allow small, natural balance corrections — gentle ankle sway, the arms adjusting a little, the fingertips touching the wall momentarily and easing off. Composed and in control.
9.0-10.0s She settles, still holding the line, ending in a stable held position.

Throughout, the following must never break: the two feet stay in one straight heel-to-toe line and never drift apart into a normal stance, the body stays tall and upright, the arms stay slightly out for balance, and she never stumbles or looks unsafe.

ANATOMY: the body must stay one consistent person for all 10 seconds. Limbs must not morph, stretch, swap length or change count. Feet stay a normal size and shape and stay on the floor. Hands keep five fingers. The face stays the same face.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. No painted floor line or tape. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions. No falling or stumbling.

10 seconds, 9:16 portrait.
```

## 6. `tandem_walk.mp4` — Heel-to-toe walking

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai man in his early 70s, pale blue polo shirt, dark trousers, flat non-slip shoes, in a clear home hallway with a plain wall close by on his right, within arm's reach. The floor is completely clear of rugs, cables and furniture.

CAMERA: completely locked off and motionless for the whole 10 seconds, positioned slightly ahead of him in three-quarter front view, framing his whole body — he walks gently towards the camera, which never moves to follow him. No pan, no zoom, no dolly, no tracking, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — six slow heel-to-toe steps:
0.0-1.0s  Standing at the start of the line, feet together, head up.
1.0-9.0s  He takes SIX slow heel-to-toe steps forward, roughly one every 1.3 seconds. On each step the heel of the stepping foot comes down directly in front of the toes of the other foot, both feet staying on a single straight line. Each step is placed deliberately, with a brief moment of balance before the next.
9.0-10.0s He brings his feet together and stops, standing still.

Throughout, the following must never break: his head stays UP and his eyes look AHEAD along the hallway, never down at his feet; the heel lands directly in front of the opposite toes on every single step; his arms stay slightly out from his sides for balance; the wall stays close enough to touch; and the pace stays slow and careful, never a normal walking speed.

ANATOMY: the body must stay one consistent person for all 10 seconds. Limbs must not morph, stretch, swap length or change count. Legs must not cross through each other or pass through the body. Feet stay a normal size and shape. Hands keep five fingers. The face stays the same face.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. No painted floor line or tape. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions. No obstacles or clutter in the walking path.

10 seconds, 9:16 portrait.
```

## 7. `backward_walk.mp4` — Backward walking

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai woman in her mid-70s, pale blue long-sleeved top, dark trousers, flat non-slip shoes, in a completely empty home hallway with a plain wall alongside. A younger adult family member stands close beside and slightly behind her throughout, one hand hovering near her back, ready to steady her without touching. The floor behind her is entirely clear.

CAMERA: completely locked off and motionless for the whole 10 seconds. Side view of the hallway, both figures full body in frame, with the empty floor behind her clearly visible. No pan, no zoom, no dolly, no tracking, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — five slow backward steps:
0.0-1.0s  Standing still, upright, the companion beside her.
1.0-9.0s  She takes FIVE slow, short backward steps, roughly one every 1.6 seconds. On each step the stepping foot reaches back and the TOES come down first, then the heel settles. The steps are visibly SHORT — never long reaching strides. The companion moves with her, staying at her side and keeping the same ready posture.
9.0-10.0s She brings her feet together and stops, standing still and upright.

Throughout, the following must never break: the toes touch down before the heel on every step, the step length stays short, her posture stays upright and she does not twist round to look behind her, the floor behind her stays completely clear, and the companion stays within reach the entire time.

ANATOMY: both figures must stay consistent people for all 10 seconds. Limbs must not morph, stretch, swap length or change count. Legs must not cross through each other or pass through the body. The two figures must not merge or overlap into one another. Hands keep five fingers. Faces stay the same faces.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions. No rugs, furniture, cables or clutter anywhere on the floor. No stumbling, tripping or near-fall.

10 seconds, 9:16 portrait.
```

---

# Batch 3 — Posture (5 clips)

## 8. `hip_hinge.mp4` — Hip hinge

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai woman in her mid-70s, pale blue long-sleeved top, dark trousers, flat non-slip shoes, standing on a plain floor against a plain wall, feet hip-width apart.

CAMERA: completely locked off and motionless for the whole 10 seconds. STRICT SIDE PROFILE at hip height, full body in frame — this angle is chosen precisely so the straightness of her spine is the most obvious thing in every frame. No pan, no zoom, no dolly, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — two slow hinges:
0.0-1.0s  Standing tall, feet hip-width apart, stomach gently braced.
1.0-3.0s  She pushes her HIPS BACKWARDS while her knees bend only slightly, tipping forward to roughly 45 degrees.
3.0-4.0s  She holds briefly at the bottom of the hinge.
4.0-6.0s  She drives her hips forward and returns to standing tall, the movement powered from the hips and buttocks.
6.0-7.0s  Standing tall.
7.0-9.0s  A second identical hinge, down and back up.
9.0-10.0s Standing tall in the exact starting position. Still.

The clip must LOOP CLEANLY: the last frame matches the first frame.

THIS IS THE MOST IMPORTANT REQUIREMENT IN THE WHOLE SET: her BACK MUST STAY PERFECTLY FLAT AND STRAIGHT LIKE A RULER in every single frame, from tailbone to the top of her head, including at the very bottom of the hinge. There must be NO ROUNDING OR CURVE in her spine at any moment of the movement. Her neck continues the same straight line, so her gaze travels down to a point on the floor ahead of her feet as she hinges. Her hips must travel clearly BACKWARDS, behind her heels, rather than her simply bending at the waist.

ANATOMY: the body must stay one consistent person for all 10 seconds. Limbs must not morph, stretch, swap length or change count. The spine must not bend in any way a spine cannot. Hands keep five fingers. The face stays the same face.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. Absolutely no rounded, curved or hunched spine at any point. No deep squat. No touching the toes. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions.

10 seconds, 9:16 portrait.
```

## 9. `chin_tuck.mp4` — Chin tuck

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai man in his early 70s, pale blue polo shirt. Head, neck, shoulders and upper chest only, sitting tall against a plain background.

CAMERA: completely locked off and motionless for the whole 10 seconds. STRICT SIDE PROFILE of head, neck and shoulders, filling most of the frame — this angle is chosen so the backward travel of the chin and the level eye line are both unmistakable. No pan, no zoom, no dolly, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — one repetition with the full five-second hold:
0.0-1.0s  Sitting tall in a neutral position, looking straight ahead, eyes level, shoulders relaxed and down.
1.0-2.0s  He draws his CHIN STRAIGHT BACKWARDS, horizontally towards his throat, creating a gentle double chin. The back of his head travels up and back and his neck lengthens.
2.0-7.0s  He HOLDS the tuck for a full five seconds, completely steady.
7.0-8.0s  He releases slowly back to the neutral starting position.
8.0-10.0s Rests in neutral, still.

The clip must LOOP CLEANLY: the last frame matches the first frame.

Throughout, the following must never break: the movement is PURELY BACKWARDS along a level line. His head must NEVER tip up and NEVER nod down — the eyes stay level and facing forward for all 10 seconds, and a viewer watching the eye line should see it hold perfectly horizontal. His shoulders stay relaxed and down and must not shrug or rise. No hand touches his face.

ANATOMY: the head, face and neck must stay one consistent person for all 10 seconds. The face must not morph, change age, or shift features between frames. The neck must not stretch unnaturally or bend in a way a neck cannot. The ears and jawline stay consistent.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. No head tilting up or down. No hand pushing the chin. No neck stretching to the side. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions.

10 seconds, 9:16 portrait.
```

## 10. `scapular_squeeze.mp4` — Shoulder blade squeeze

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai woman in her mid-70s, in a fitted pale blue long-sleeved top through which the shape of the shoulder blades can be read. Upper body from head to mid-back, sitting tall.

CAMERA: completely locked off and motionless for the whole 10 seconds. View from DIRECTLY BEHIND her, upper body filling the frame — this angle is chosen so the two shoulder blades drawing together is clearly readable. No pan, no zoom, no dolly, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — one repetition with the full five-second hold:
0.0-1.0s  Sitting tall, arms relaxed by her sides, upper back neutral.
1.0-2.0s  She squeezes her SHOULDER BLADES TOGETHER towards her spine, as though gently holding a pencil between them. Her chest opens and her upper back flattens.
2.0-7.0s  She HOLDS the squeeze for a full five seconds, steady.
7.0-8.0s  She releases slowly back to neutral.
8.0-10.0s Rests in neutral, still.

The clip must LOOP CLEANLY: the last frame matches the first frame.

Throughout, the following must never break: her SHOULDERS STAY DOWN and must NEVER shrug up towards her ears at any point — the neck stays long for all 10 seconds, and the shrug is the single most common error this clip has to avoid showing. Her arms stay relaxed by her sides and do not lift, bend or swing. Her head stays still and facing forward.

ANATOMY: the body must stay one consistent person for all 10 seconds. The shoulders, arms and back must not morph, stretch or change proportion. Arms must not change length or count. The movement in the upper back must stay within what a real shoulder blade can do.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. No shrugged or raised shoulders. No arms lifting or bending. No resistance band. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions.

10 seconds, 9:16 portrait.
```

## 11. `safe_pickup.mp4` — Picking things up safely

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai woman in her mid-70s, pale blue long-sleeved top, dark trousers, flat non-slip shoes, in a plain home room. A small light object — a folded cloth — lies on the floor beside a sturdy chair.

CAMERA: completely locked off and motionless for the whole 10 seconds. Side view at low height, full body in frame, chosen so the straightness of her back and the supporting hand on her thigh are both clear throughout. No pan, no zoom, no dolly, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — one complete safe lift:
0.0-1.0s  Standing upright near the cloth on the floor.
1.0-2.0s  She steps in CLOSE to the object, so it is right beside her feet rather than out at arm's reach.
2.0-4.5s  She lowers herself by KNEELING DOWN ONTO ONE KNEE, her back staying completely straight and upright throughout the descent, one hand travelling down to SUPPORT HER WEIGHT ON HER FRONT THIGH.
4.5-6.0s  Still kneeling with a straight back and the supporting hand on her thigh, she picks the cloth up with her free hand and brings it close to her body.
6.0-9.0s  She PUSHES UP WITH HER LEGS to return to standing, back still perfectly straight, using the hand on her thigh for support as she rises.
9.0-10.0s Standing upright holding the cloth close to her body. Still.

Throughout, the following must never break: her BACK STAYS COMPLETELY STRAIGHT with no rounding of the spine at any moment of the lower, the lift or the rise. Her shoulders and hips stay facing the same direction — her back must NEVER twist. The object stays close to her body. The whole movement is slow and controlled.

ANATOMY: the body must stay one consistent person for all 10 seconds. Limbs must not morph, stretch, swap length or change count. Knees bend only as knees bend. The spine must not bend in any way a spine cannot. Hands keep five fingers. The face stays the same face.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. CRITICALLY: do not show the wrong technique at any point in the clip — never bending from the waist with straight legs, never a rounded spine, never twisting. There is no "wrong way" demonstration in this video. No heavy or large object. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions.

10 seconds, 9:16 portrait.
```

## 12. `seated_row_band.mp4` — Seated band row

```
A 10-second instructional exercise clip for an osteoporosis app used by Thai adults aged 65-85. Clean flat vector-style medical illustration with soft cel shading, muted blue palette on a light blue-grey background, matching the still image exactly.

Subject: a Thai man in his early 70s, pale blue polo shirt, dark trousers, flat non-slip shoes, sitting tall on a sturdy wooden dining chair without armrests, feet flat on the floor. A light green elastic resistance band runs forward from his hands to a fixed anchor point on the wall in front of him at CHEST HEIGHT.

CAMERA: completely locked off and motionless for the whole 10 seconds. Side view at chest height, full body in frame, with the band's anchor point on the wall visible. No pan, no zoom, no dolly, no orbit, no handheld drift. One continuous shot, no cuts.

MOTION, beat by beat — two rows, each with the full two-second hold:
0.0-1.0s  Sitting tall, arms extended forward, holding one end of the band in each hand, band under light tension.
1.0-2.5s  He pulls both ELBOWS BACK past his ribs, keeping them close to his sides, squeezing his shoulder blades together. The band stretches.
2.5-4.5s  He HOLDS for a full two seconds, blades squeezed, elbows back.
4.5-6.0s  He releases slowly forward under control, letting the band shorten — not letting it snap back.
6.0-7.5s  A second identical pull, elbows back past the ribs.
7.5-9.5s  A second two-second hold.
9.5-10.0s He begins the slow release, ending close to the extended starting position.

The clip must LOOP CLEANLY: the last frame is close to the first frame.

Throughout, the following must never break: his TORSO STAYS UPRIGHT AND VERTICAL for all 10 seconds — he must NEVER lean backwards to pull harder, and never round forward on the release. His shoulders stay DOWN and never shrug. His feet stay flat on the floor and his seat stays on the chair. The band stays anchored at chest height and does not drift up or down.

ANATOMY: the body must stay one consistent person for all 10 seconds. Limbs must not morph, stretch, swap length or change count. Elbows bend only as elbows bend. Hands keep five fingers and keep hold of the band throughout — the band must not detach, pass through his hands, or change into a different object. The face stays the same face.

Do not include: arrows, motion lines, text, letters, numbers, captions, labels, watermarks, logos, or any audio. No leaning back or rocking. No rowing machine or gym equipment. No camera movement of any kind. No slow-motion or speed ramping. No cuts or transitions.

10 seconds, 9:16 portrait.
```

---

## Checklist

Batch 1 — Balance → `media/exercises/`

- [ ] `sit_to_stand_hold.mp4`
- [ ] `standing_marching.mp4`
- [ ] `weight_shifts.mp4`
- [ ] `single_leg_stand_chair.mp4`
- [ ] `tandem_stand.mp4`
- [ ] `tandem_walk.mp4`
- [ ] `backward_walk.mp4`

Batch 3 — Posture → `media/exercises/`

- [ ] `hip_hinge.mp4`
- [ ] `chin_tuck.mp4`
- [ ] `scapular_squeeze.mp4`
- [ ] `safe_pickup.mp4`
- [ ] `seated_row_band.mp4`

## Reviewing each clip

Step through it frame by frame before accepting it. Four questions:

1. **Does the body stay one person?** Watch the hands and the joints. Morphing
   is most common mid-movement, where you are least likely to look.
2. **Does the teaching cue hold in every frame?** Not just at the start and end
   — the flat back through the whole hinge, the shoulders down through the whole
   squeeze, the heel landing in front of the toes on every step.
3. **Did the camera move?** Any drift, zoom or orbit means regenerate. A moving
   camera makes an exercise harder to copy.
4. **Does the last frame match the first?** These play in a small card and a
   visible jump on repeat is distracting.

If a clip fails twice on the same fault, stop generating it and film that one
instead. Fighting a video model past two attempts costs more than a tripod.
