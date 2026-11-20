# 029 - Highlight occupied obstacle cells

Replace obstacle circles with glowing frames whose line centres match the four
cell borders. Preserve green fixed signs, blue moving chevrons and independent
blinking. Keep unused ring/glow/model modules.

Only chevrons move continuously. The centre chevron determines the highlighted
cell; its frame jumps at the cell boundary. Publish this occupancy before the
game tick and use it for direction checks, apple-arrow clearance and bonuses.
Check actual animated head contact after head movement, without predicting
collisions against the obstacle's future target. On contact restore the pending
body step and animation state, preserve the tail and reverse-input guard.

Changed files:
- `src/assets/obstacleSymbols/ObstacleCellFrame.tsx` (new)
- `src/assets/obstacleSymbols/FixedObstacleSymbol.tsx`
- `src/assets/obstacleSymbols/MovingObstacleSymbol.tsx`
- `src/assets/trainingArena/createTrainingArena.ts`
- `src/components/Obstacles.tsx`
- `src/components/Snake.tsx`
- `src/engine/obstacles/highlightedObstacleCells.ts` (new)
- `src/engine/obstacles/breakObstacles.ts`
- `src/engine/events/highlightedHeadContact.ts` (new)
- `src/engine/events/snakeObstacleContactEvent.ts`
- `src/engine/events/changeDirectionEvent.ts`
- `src/engine/protocol/startLevel.ts`
- `src/engine/snake/setSnakePosition.ts`
- `src/animations/snakeAnimation/headAnimations/snakeHeadLocation.ts`
- `scripts/check-highlighted-obstacles.cjs` (new)
- `scripts/check-moving-symbols.cjs`
- this record.

Validation commands: `node scripts/check-highlighted-obstacles.cjs`,
`node scripts/check-contact-reverse.cjs`,
`node scripts/check-moving-symbols.cjs`,
`node scripts/check-level-transitions.cjs`, `npm.cmd run build`.
The new harness checks midpoint occupancy, continuous glyphs/discrete frames,
pause, actual head-only collision, tail rollback/resume and bonus removal.

Manual checks:
1. On level 1 inspect fixed and moving frames at several zoom settings: their
   sides should follow the grid borders. Chevrons retain their blinking.
2. Follow moving obstacles on both axes: frames jump when the middle chevron
   crosses a boundary, while chevrons continue smoothly.
3. Enter an unlit neighbouring cell, then a highlighted cell. Only the latter
   causes an obstacle error. A body segment alone must not cause that error.
4. After contact try reversing, then a free perpendicular direction: reverse
   stays blocked, the tail remains and normal movement resumes.
5. Check pause, restart, next level and obstacle-breaking bonus.
