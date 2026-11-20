# 016 - Follow the snake when the field exceeds the viewport

Project the actual octagonal field vertices through the calibrated fixed camera,
including canvas placement, zoom and pan. If any edge leaves the viewport, use a
separate camera that copies the fixed camera's parameters and translates parallel
to its image. The first following frame preserves the inherited view exactly.
Follow the animated head with a central dead zone and time-based smoothing.
Zooming out restores the fixed framing smoothly. Reset the offset on level changes.
The reference backdrop and panel clearances follow the field's projected shift.

Validation: `node scripts/check-following-camera.cjs`,
`node scripts/check-level-transitions.cjs`, `npm.cmd run build`.

Manual checks:
1. Zoom until an actual field edge leaves the screen: no camera jump or rotation.
2. Drive the snake toward each visible edge: camera should smoothly keep it visible.
3. Zoom back out: the calibrated overview should return smoothly.
4. Repeat in the rotated layout, after panning, resizing and a level transition.
