# Move-tab Media Clip List

Filming checklist for the Move tab. One short clip (or a single photo)
per exercise `id` in `app-core.js` → `EXERCISE_LIST`.

**Media is gated: nothing is shown until the file exists.** The Move tab
renders a video or image area *only* for exercises listed in
`MEDIA_MANIFEST` (in `app-core.js`) with a non-empty `src`. Until then
each exercise shows its written name, how-to steps and amount — never an
empty placeholder box.

## Adding a clip

1. Put the file in `media/exercises/` — e.g. `media/exercises/sit_to_stand.mp4`
   (H.264, portrait 9:16, ≤15 s, no audio needed — the app renders the
   Thai/English instructions itself) or `sit_to_stand.jpg` for a photo.
2. Add the entry to `MEDIA_MANIFEST` in `app-core.js`:

```js
var MEDIA_MANIFEST = {
  sit_to_stand: { type: 'video', src: 'media/exercises/sit_to_stand.mp4', poster: 'media/exercises/sit_to_stand.jpg' },
  heel_raises:  { type: 'image', src: 'media/exercises/heel_raises.jpg' }
};
```

3. Add the file to `SHELL_FILES` in `sw.js` only if it should be
   available offline — video files are large, so prefer leaving them to
   the network.

`type` is `video` or `image`; `poster` is optional and only used for video.

## Clips to film

| id | group | TH name | EN name | Levels | Notes for filming |
|---|---|---|---|---|---|
| sit_to_stand_hold | balance | ลุกยืนจากเก้าอี้โดยจับที่พยุง | Sit-to-stand with support | 1,2,3 | Hands on armrests throughout |
| standing_marching | balance | ยืนย่ำเท้าอยู่กับที่ | Standing marching | 1,2,3 | Both hands on the chair back |
| weight_shifts | balance | โยกน้ำหนักตัวซ้าย-ขวา | Side-to-side weight shifts | 1,2,3 | Show the 3-second hold each side |
| single_leg_stand_chair | balance | ยืนขาเดียว | Single-leg stance | 2,3 | Chair within arm's reach in frame |
| tandem_stand | balance | ยืนเท้าเรียงต่อกัน | Heel-to-toe stand | 2,3 | Side-on to a wall, fingertips resting |
| tandem_walk | balance | เดินต่อเท้าเป็นเส้นตรง | Heel-to-toe walking | 3 | Clear floor line, eyes ahead |
| backward_walk | balance | เดินถอยหลัง | Backward walking | 3 | Empty hallway, short steps |
| sit_to_stand | strength | ลุก-นั่งเก้าอี้ | Sit-to-stand | 1,2,3 | Arms crossed, controlled descent |
| heel_raises | strength | เขย่งปลายเท้า | Heel raises | 1,2,3 | Hold the chair, 2-second hold at the top |
| wall_pushups | strength | ดันกำแพง | Wall push-ups | 1,2,3 | Side angle shows the straight body line |
| hip_abduction | strength | ยกขาออกด้านข้าง | Standing hip abduction | 1,2,3 | Toes forward, no leaning |
| step_ups | strength | ก้าวขึ้นขั้นบันได | Step-ups | 2,3 | Bottom step with the rail in frame |
| hip_hinge | posture | ก้มโดยพับสะโพก | Hip hinge | 1,2,3 | Side angle; flat back is the whole point |
| chin_tuck | posture | เก็บคาง ยืดคอ | Chin tuck | 1,2,3 | Profile angle shows the cue best |
| scapular_squeeze | posture | หนีบสะบัก | Shoulder blade squeeze | 1,2,3 | From behind; shoulders stay down |
| safe_pickup | posture | วิธีหยิบของจากพื้นอย่างปลอดภัย | Picking things up safely | 1,2,3 | Kneel + hand on thigh; contrast with the wrong way |
| seated_row_band | posture | ดึงยางยืดโดยหลังตรง | Seated band row | 2,3 | Band anchored at chest height |

17 clips for v1. To add a new exercise: add a row here, add the entry to
`EXERCISE_LIST` (with `howTo` in both languages), then film.
