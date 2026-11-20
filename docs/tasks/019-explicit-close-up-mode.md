# 019 - Normal overview and explicit close-up

Default to the normal overview: fixed camera, zoom limited to 160%, original
scene displays visible, DOM information panels hidden with no reserved panel
clearances. Keep viewport-sized rendering in both modes.

The explicit "Крупный план" button enters at 400%, enables camera following
and information panels, and hides all decorative scene displays. Zoom can be
adjusted up to 400% within this mode. The button becomes "Обычный вид" to exit;
restore the saved normal scale and pan, fixed camera, and original scene displays.
Mode changes update the existing arena without remounting gameplay.
The button follows the existing control placement and 90-degree layout.

Supersedes automatic entry into following mode (016) and per-display visibility
(018). Gameplay timing and speed are unchanged.

Changed files: `ArenaViewport.tsx`, `createTrainingArena.ts`, `followingCamera.ts`,
`gameInfo.css`, `trainingArena.css`, `check-level-transitions.cjs`, this record.

Validation: `node scripts/check-level-transitions.cjs` exercises the 160% cap,
explicit 400% entry, fixed/following selection, scene-display visibility, scale/pan
restoration, rotated switches, renderer recovery and level transitions.
Also run `node scripts/check-following-camera.cjs`,
`node scripts/check-viewport-camera.cjs`, and `npm.cmd run build`.

Manual checks:
1. Open a game: no side/top/bottom information bars, fixed camera, maximum 160%.
2. Select close-up: 400%, following camera, HUD panels, no decorative displays.
3. Adjust zoom/pan, move the snake and return to normal: restore the saved view.
4. Repeat after rotation, resize and a level change; verify controls remain usable
   and switching modes neither restarts gameplay nor changes snake speed.
