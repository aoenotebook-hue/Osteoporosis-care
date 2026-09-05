# Osteo Move-tab Video Clip List

Filming checklist for the Move tab exercise library. Same format as
`acl-video-clip-list.md` in the ACL app: one short clip per exercise `id`
in `app-core.js` → `EXERCISE_LIST`. Until a clip is uploaded, the app
shows the exercise's written name + reps instead of a blank tile
(`videoUnavailable` fallback) — never ship a tile with no fallback text.

File naming: `media/exercises/<id>.mp4` (H.264, portrait 9:16, ≤15s, no
audio required — captions are rendered by the app from `CONTENT`).

| id | group | TH name | EN name | Levels | Notes for filming |
|---|---|---|---|---|---|
| sit_to_stand_hold | balance | ลุกยืนจากเก้าอี้ (มีที่จับ) | Sit-to-stand with support | 1,2,3 | Hands on chair arms throughout |
| standing_marching | balance | ยืนย่ำเท้าอยู่กับที่ | Standing marching | 1,2,3 | Hold chair back with both hands |
| single_leg_stand_chair | balance | ยืนขาเดียว | Single-leg stance | 2,3 | Chair visible within arm's reach |
| tandem_stand | balance | ยืนเท้าเรียงชิด | Tandem stance | 2,3 | Show hand lightly touching wall |
| tandem_walk | balance | เดินเท้าเรียงชิด | Tandem walk | 3 | Clear floor line, no support shown |
| backward_walk | balance | เดินถอยหลัง | Backward walk | 3 | Film in a hallway, clear of obstacles |
| weight_shifts | balance | โยกน้ำหนักตัวซ้าย-ขวา | Side-to-side weight shifts | 1,2,3 | Both hands on chair back |
| sit_to_stand | strength | ลุกนั่งเก้าอี้ | Sit-to-stand | 1,2,3 | Full stand, controlled sit |
| heel_raises | strength | เขย่งปลายเท้า | Heel raises | 1,2,3 | Hands on chair for balance |
| wall_pushups | strength | วิดพื้นกำแพง | Wall push-ups | 1,2,3 | Feet back at ~45°, controlled tempo |
| hip_abduction | strength | ยกขาออกด้านข้าง | Standing hip abduction | 1,2,3 | Hold chair, straight leg lift to side |
| step_ups | strength | ก้าวขึ้นบันไดขั้นเดียว | Single-step step-ups | 2,3 | Low single step, wall/rail in frame |
| hip_hinge | posture | ก้มโดยงอสะโพก | Hip hinge | 1,2,3 | Flat back throughout, knees soft |
| chin_tuck | posture | เก็บคาง | Chin tuck | 1,2,3 | Seated, profile angle helps show cue |
| scapular_squeeze | posture | หนีบสะบัก | Scapular squeeze | 1,2,3 | Seated or standing, front angle |
| safe_pickup | posture | วิธีหยิบของจากพื้นอย่างปลอดภัย | How to pick things up safely | 1,2,3 | Show hip-hinge + one hand on support |
| seated_row_band | posture | ดึงยางยืดหลังตรง | Seated resistance-band row | 2,3 | Band anchored at chest height |

Total: 17 clips for v1 (plan allows for ~25; add new rows here first,
then a matching entry in `EXERCISE_LIST` in `app-core.js`, before
filming — keeps the manifest and the code in sync).
