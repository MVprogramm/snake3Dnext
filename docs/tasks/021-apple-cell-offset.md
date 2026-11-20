# 021 - Apple offset in close-up HUD

Add an apple indicator at the start of the first information panel. Two rows
show signed horizontal and vertical cell offsets from the committed snake-head
cell to the current apple: right/up positive, left/down negative, zero unsigned.
The existing close-up-only panel visibility hides it in normal mode.

Read grid coordinates through a read-only engine selector, independent of world
cell size, zoom and head elevation. On clockwise 90-degree arena rotation, map
grid Y to screen right and negative grid X to screen up. Counter-rotate the readout
inside the rotated HUD so its arrows and text remain in screen directions.
Update text only when its value changes. Show dashes when no apple is available.
Gameplay behavior is unchanged.

Changed files: `src/engine/food/getFoodOffset.ts`,
`src/assets/trainingArena/appleOffset.ts`, `createTrainingArena.ts`,
`GameInfo.tsx`, `gameInfo.css`, `scripts/check-apple-offset.cjs`,
`scripts/check-level-transitions.cjs`, this record.

Validation: `node scripts/check-apple-offset.cjs` covers movement, new apple,
signs, zero, rotated axes and unavailable data. The arena regression script also
checks the actual readout during close-up, head movement, apple replacement and
viewport rotation. Run both scripts and `npm.cmd run build`.

Manual checks: enter 400%; compare both numbers to the grid; move one cell in each
direction, eat an apple, rotate the screen and change level. Verify plus remains
right/up, readout stays inside the panel, and normal mode hides it.
