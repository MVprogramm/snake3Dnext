# 012 - Full-height opaque info bars

## Change

Left/right game-info groups now form opaque full-height edge bars with five indicators each, distributed vertically. Their shared base width is responsive (64-96px); each side independently grows to cover any exposed area beside the reference image. The arena publishes the visible left/right gaps as CSS properties on its wrapper when reference size or pan changes, accounting for the rotated portrait layout. These properties are cleared when the arena is disposed.

The pan/zoom handle is positioned inward from the right bar so its resting position remains visible. The bars are fixed overlays and do not resize the Canvas or alter the reference camera. The base width was reduced after visual feedback: it had covered more of the arena than the gaps required. Smaller type and horizontal padding keep the indicators compact. Gameplay is unchanged.

## Changed files

- `src/styles/gameInfo.css`: full-height opaque bars and adaptive width.
- `src/styles/trainingArena.css`: pan/zoom handle placement.
- `src/assets/trainingArena/createTrainingArena.ts`: publish current exposed side widths on zoom/pan/layout changes.
- `scripts/check-level-transitions.cjs`: verify minimum-zoom side gaps and cleanup alongside existing layout checks.
- `docs/tasks/012-full-height-info-bars.md`: this record.

## Validation

Extended checks instantiate the actual arena factory, zoom a wide viewport down to its minimum, and verify both published widths match the exposed side regions. They also verify returning to original scale removes gaps and disposal clears the properties. Existing transition/camera/timer checks passed. Browser visual verification remains pending.

## Manual checks

1. Check both bars reach the top/bottom edges and are opaque, with five indicators per side.
2. On a wide screen, zoom out until side gaps would appear: bars must cover them fully. Zoom back in and check widths return.
3. Pan at different scales and resize/rotate the viewport: check side coverage and the alignment of the arena/background.
4. Confirm the pan/zoom handle remains accessible and the menu/home button stay above the bars.
5. Complete a level and continue: bars and field must retain their framing.
