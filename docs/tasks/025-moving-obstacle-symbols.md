# 025 - Moving obstacle symbols and first-level examples

Add two X-axis and two Y-axis moving obstacles to level one in `levels.json`,
retaining its fixed obstacle and all other level parameters. Existing placement,
movement, collisions, speed and bounce rules remain in use.

Replace all moving hedgehog visuals with flat blue floor symbols: a glowing
80%-cell circle containing three pale chevrons. Centre each sign on the existing
interpolated obstacle position. Rotate chevrons to the stored nonzero movement
direction, including border bounces. Remove the old model-only scaling/offset.
The unused hedgehog model stays on disk. Share the existing static glow shader
between fixed and moving signs without changing the fixed sign's appearance.

Changed files: `src/assets/obstacleSymbols/MovingObstacleSymbol.tsx`,
`ObstacleGlow.tsx`, `FixedObstacleSymbol.tsx`, `src/components/Obstacles.tsx`,
`src/engine/levels/levels.json`, `scripts/check-moving-symbols.cjs`, this record.

Validation: `node scripts/check-moving-symbols.cjs` checks the first-level counts,
placement, real movement and border bounce on both axes, actual glyph rotation,
three chevrons and valid bounds over subsequent steps.
Also run `node scripts/check-level-transitions.cjs` and `npm.cmd run build`.

Manual checks: start/restart level one, check four blue moving signs and one fixed
sign. Check horizontal/vertical interpolation, chevron reversal at walls and
obstacles, pause/resume, collision with the snake, normal/400% views and rotation.
Advance a level and verify old signs do not persist.
