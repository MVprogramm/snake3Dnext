# 011 - Restore transverse wave on the smooth trail

## Cause and change

The legacy animation still computed lateral motion in raw body positions, but the new trail renderer used the head history for body XY and therefore discarded it. A visual wave is now applied after spatial trail sampling and grounding, using the local horizontal normal of each segment's path.

The head stays on its route. Body/tail amplitude ramps over the first two segments to at most 0.12 cells; wavelength is four cells. Phase advances with horizontal distance travelled, so movement speed naturally controls the rate, stationary poses do not drift, and a level/reset begins without an immediate sideways jump. Segment yaw follows the displaced centerline. Height and pitch are preserved, including the grounded flat tail.

## Changed files

- `src/animations/snakeAnimation/smoothSnakeTrail.ts`: visual normal displacement, distance phase, reset and heading.
- `scripts/check-snake-wave.cjs`: focused wave regression checks.
- `docs/tasks/011-transverse-body-wave.md`: this record.

## Validation

`node scripts/check-snake-wave.cjs` passed for all four directions, phase progression, unchanged head, perpendicular/bounded offsets, unchanged height/pitch, grounded tail, pause stability and reset. `node scripts/check-level-transitions.cjs` also passed. Browser visual verification remains pending.

## Manual checks

1. Grow the snake and move straight in all four directions: body and tail should sway across the route while the head remains steady.
2. Compare low and maximum speeds and several successive turns: the wave should follow the local direction without breaking smooth corners.
3. Pause/resume: the body should hold its shape on pause and continue smoothly after movement resumes.
4. Eat the first apple and later apples: the tail must remain on the field while the front rises.
5. Finish a level: verify the field remains aligned and the wave resets on the new snake.
