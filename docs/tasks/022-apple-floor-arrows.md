# 022 - Apple directions as floor stencils

Replace the numeric HUD readout with two flat pale-cyan outline arrows on the field,
matching the reference image's lane-marking style. Show them only in close-up.
Each arrow points along one field axis toward the apple and occupies a neighbouring
cell. Its length increases linearly with absolute grid-cell distance, using the
same scale for both axes and remaining within one cell. Hide an axis when its
distance is zero. There are no numbers.

Hide both arrows when the rendered apple's centre enters the current cropped
viewport with a 10% margin from each edge. Partial entry or a leaf at the edge
keeps guidance visible. Check the actual named apple object, its visibility and
current world bounds, including elevation, size and the following camera.
Arrows have nearly cell-sized bounds and a broad shaft. The cyan outline is
dashed, made of flat quads with empty gaps and no filled interior. Length varies
between 20% and 100% of the silhouette for a clearly visible distance cue.
Measure distance from the animated head XY to the apple's scene XY each frame,
not only from the committed grid cell, so length changes during each cell crossing.

Arrow centres follow the animated head XY continuously, while their height stays
just above the floor even during head lift. At clipped corners use distinct
playable adjacent cells. The arrows belong to the game plane, so perspective,
zoom, camera following and screen rotation apply naturally. Depth testing keeps
them painted on the floor rather than overlaid on snake models.

Hide an arrow in the single cell between the head and an obstacle two cells away
along that neighbour direction. Also hide it if the neighbour itself is occupied.
Use current fixed/X/Y obstacle coordinates each frame; leave the other arrow
unchanged and restore the hidden one when the gap clears. Do not relocate it.

Keep the unused prior formatter and its check script on disk. Preserve the
existing training-path highlight and other scene modules.

Changed files: `src/assets/trainingArena/appleArrows.ts`, `createTrainingArena.ts`,
`src/components/GameInfo.tsx`, `src/styles/gameInfo.css`,
`scripts/check-apple-arrows.cjs`, `scripts/check-level-transitions.cjs`, this record.
Visibility update also changes `src/components/Apple.tsx` and adds
`src/assets/trainingArena/cameraVisibility.ts`, `scripts/check-camera-visibility.cjs`.

Validation: `node scripts/check-apple-arrows.cjs` checks direction, increasing
length, equal distance scale, neighbouring cells, continuous movement, floor
height, zero axes, clipped corners and mode visibility. Arena regression checks
cover actual integration, head movement, new apples, rotation and normal-mode
hiding. Run both scripts and `npm.cmd run build`.
`node scripts/check-camera-visibility.cjs` checks the centre margin, partial-entry rejection, 400% cropping,
hidden objects, the near/far direction and camera motion; the arena regression
checks hiding and restoring the arrows with a rendered apple object.

Manual checks: enter 400%, move and turn, eat apples and rotate the viewport.
Verify two pale-cyan marks beside the head, shorter arrows when approaching the
apple, no number display and no arrow lift. Check corners and return to normal.
Move the apple into and out of the frame: both arrows must disappear as soon as
the apple centre clears the edge margin, and return when it moves back out.
