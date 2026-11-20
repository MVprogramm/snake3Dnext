# 003 - Shared arena grid

## Result

All levels use `src/engine/field/arena.json`: 43 columns, 23 rows, cell size 1 in arena-local units. Cell coordinates are 1-based; the center is (22, 12). The grid is centered within the existing calibrated surface; the camera and viewport controls are preserved. The imported arena transform still applies to the entire composition.

The surface is 44.5 x 24.68228 before its calibrated X/Y scales (0.988 / 0.9595). The original corner cut is 1.9. A cell is playable only when all four corners fit inside the octagon. This yields 977 playable cells; 12 cells intersecting the four corner cuts are excluded. Surface texture lines now correspond to actual movement cells. Cells outside the grid are decorative margin, not extra movement space.

`field` was removed from level JSON. The existing `getField()` name remains as a compatibility accessor for column count; `getFieldRows()` returns row count. No level can resize the arena.

## Changed files

- Configuration/loading: `src/engine/field/arena.json`, `src/engine/field/fieldPerLevel.ts`, `src/engine/levels/levels.json`, `src/engine/levels/loadLevelProps.ts`.
- Geometry/spawns: `src/engine/field/fieldGeometry.ts`, `src/engine/field/getFreeCell.ts`, `src/engine/field/cellsAroundObstacle.ts`, `src/engine/events/setFoodEvent.ts`, `src/engine/events/setObstacleEvent.ts`.
- Boundaries/routes: `src/engine/events/snakeBorderContactEvent.ts`, `src/engine/events/changeDirectionEvent.ts`, `src/engine/events/noMovesEvent.ts`, `src/engine/food/applePathForecast.ts`, `src/engine/obstacles/checkObstaclePosition.ts`, `src/engine/obstacles/contactBorderObstacle.ts`.
- Center/count: `src/engine/protocol/startLevel.ts`, `src/engine/protocol/snakeGrowthPressure.ts`, `src/engine/snake/getCurrentHeadState.ts`.
- Rendering: `src/assets/trainingArena/createTrainingArena.ts`, `src/components/ArenaViewport.tsx`, `src/components/Obstacles.tsx`, `src/components/ApplePathHighlight.tsx`, `src/hooks/useApplePosition.ts`.
- Animation centering: `src/animations/snakeAnimation/bodyAnimations/snakeBodyLocation.ts`, `src/animations/snakeAnimation/bodyAnimations/snakeBodyMoving.ts`, `src/animations/snakeAnimation/bodyAnimations/syncSnakeGrowthTail.ts`.
- Documentation: this file.

## Validation

A focused Node/TypeScript check passed: mask symmetry and count, independent polygon containment for all four cell vertices, centered coordinates, 1,000 valid random spawns, full occupancy and last free cell, corner contact, fast movement contact, bonus wrapping, and absence of per-level field overrides. Bonus wrapping uses the opposite playable end of the current row or column. Manual browser verification remains pending.

## Manual test steps

1. Start level 1: confirm 43 x 23 grid, 12 omitted corner cells, and head centered at (22, 12).
2. Move one cell horizontally and vertically: models and path highlights should align with the visible cells; collect apples on both halves of the field.
3. Approach each straight boundary and each omitted corner: collision should stop at the last playable cell, including higher speeds. Turn away and resume.
4. Confirm apples, mushrooms and bonuses never spawn in omitted corners or decorative margins.
5. Advance through levels: dimensions, grid and object scale must stay constant. Confirm pause, restart and growth still work.
6. On level 3, activate border-crossing bonus and verify wrapping on straight edges and clipped corner rows/columns.
7. Resize the window and use pan/zoom: background, grid, objects and highlights must stay aligned.

## Non-goals

No dependency additions, camera redesign, asset deletion, scoring redesign, or unrelated rule changes. Legacy unused field/rendering modules remain present.

## Half-size cell preview

Cell size was reduced from 2 to 1. The largest centered odd grid that fits the calibrated surface is 43 x 23 (989 total cells). Odd dimensions retain a cell at the exact arena center and the existing integer-centered animation coordinates. The camera and surface dimensions stay unchanged. Models scale with cell size and are half their previous linear size. Only `src/engine/field/arena.json` and this document changed for this preview.
