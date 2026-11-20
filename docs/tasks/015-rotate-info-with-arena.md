# 015 - Rotate information panels with the arena

## Change

When the arena enters its 90-degree portrait layout, the complete information overlay now uses the same centered 90-degree transform, swapped viewport dimensions, and direction. Text, icons, ordering and bar backgrounds rotate together.

Gap calculations still start in screen coordinates, then map them back to the rotated arena's local edges: local left/right correspond to screen top/bottom; local top/bottom correspond to screen right/left. This keeps adaptive bars over the actual empty regions after rotation. When no gaps exist, panels remain on the arena's local left/right sides. Minimum bar thickness uses the swapped viewport axes. Pan/zoom control clearance is mapped back to physical screen coordinates so it remains accessible.

## Changed files

- `src/assets/trainingArena/infoLayout.ts`: local and screen gap mapping.
- `src/assets/trainingArena/createTrainingArena.ts`: publish rotation attribute and clear it on disposal.
- `src/styles/gameInfo.css`: rotate the complete info overlay and adapt control clearances.
- `scripts/check-level-transitions.cjs`: real portrait rotation, restoration and mapped margin checks.
- `docs/tasks/015-rotate-info-with-arena.md`: this record.

## Validation

Regression checks passed for entering the real arena's portrait mode, publishing HUD rotation, converting panned top/bottom screen gaps into local side widths, returning to the normal orientation, and cleanup. Existing level/camera/timer checks passed. Browser visual verification remains pending.

## Manual checks

1. Resize to trigger the arena's 90-degree mode: both full panels, text and icons must rotate in the same direction.
2. Zoom out and pan: bars should continue covering the exposed edges in rotated mode.
3. Zoom in until all gaps vanish: panels should be on the left/right relative to the rotated game.
4. Return to normal orientation: panels should become upright and cover the appropriate margins.
5. Verify pan/zoom handle access and complete a level in each orientation.
