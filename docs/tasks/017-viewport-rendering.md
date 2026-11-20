# 017 - Limit rendering to the visible viewport

Keep the full reference image as a virtual coordinate system for calibration,
zoom, pan and camera following. Allocate the WebGL renderer at the arena's visible
client size, including swapped dimensions in the 90-degree layout. A separate
render camera uses a view offset to draw only the visible rectangle with the same
pixel positions as the former full-size canvas. Scissoring preserves the original
image boundary when zoomed out; clear the whole canvas to avoid stale pixels.
Gameplay timing and speed are unchanged.

Changed files: `createTrainingArena.ts`, `viewportCamera.ts`, `trainingArena.css`,
`check-level-transitions.cjs`, `check-viewport-camera.cjs`, this task record.

Validation:
- `node scripts/check-viewport-camera.cjs`: pixel projection equality across
  50–400% scales, pan, translated camera and rotated viewport dimensions.
- `node scripts/check-level-transitions.cjs`: screen-sized renderer, including
  maximum zoom; following switch and existing layout/level recovery checks.
- `node scripts/check-following-camera.cjs`: following and return behavior.
- `npm.cmd run build`.

Manual checks: compare framing at minimum/default/400% zoom; pan and follow the
snake; rotate and resize the viewport; complete a level. Check for field/background
alignment and stale pixels. FPS improvement requires measurement in the browser.
