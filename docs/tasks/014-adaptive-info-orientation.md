# 014 - Move info bars to the exposed screen edges

## Result

The arena now computes all four exposed margins of the reference image in screen coordinates, including pan and the 90-degree portrait transform. If top/bottom empty space dominates, the wrapper switches data-info-layout to horizontal and the two five-indicator groups become full-width top and bottom bars. If side space dominates, they return to full-height left/right bars. A one-pixel tolerance ignores subpixel gaps. When the image fully covers the viewport, the layout always returns to vertical side bars.

Each bar grows to cover its actual margin with a compact minimum thickness. The pan/zoom handle follows the right/bottom clearances, and stays above the info bars while dragging. Existing fixed overlay behavior leaves the Canvas and camera dimensions unchanged.

## Changed files

- `src/assets/trainingArena/infoLayout.ts`: screen-space gap and orientation calculations.
- `src/assets/trainingArena/createTrainingArena.ts`: publish layout and four margins on scale/pan/layout changes; cleanup.
- `src/styles/gameInfo.css`: horizontal rows and adaptive heights in addition to vertical bars.
- `src/styles/trainingArena.css`: pan/zoom handle clearance and stacking.
- `scripts/check-level-transitions.cjs`: actual arena orientation/coverage regressions.
- `docs/tasks/014-adaptive-info-orientation.md`: this record.

## Validation

The existing regression script passed real-factory tests for wide-screen side gaps, tall-screen top/bottom gaps, zooming to minimum, switching back to a wide viewport, rotated portrait pan offsets, return to side bars under full coverage, and cleanup. Existing engine transitions, camera recovery and scene timer checks also passed. Browser visual verification remains pending.

## Manual checks

1. Use a wide viewport and zoom out: confirm left/right bars cover the side gaps.
2. Use a taller viewport and zoom out: confirm the same indicators move into top/bottom rows, five each, covering those gaps.
3. Resize back and forth or rotate the device: orientation and gap coverage should follow the image.
4. Pan at different zoom levels: each margin should be covered correctly, and the control handle should remain accessible.
5. Zoom in until gaps disappear: the bars must return to the left/right sides, even if they were previously horizontal. Complete a level and verify framing/controls remain correct.
