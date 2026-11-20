# 010 - Restore arena layout across level transitions

## Cause

After landing/game separation, the game menu was first loaded lazily at the level-complete dialog. While that chunk loaded, its Suspense fallback rendered a normal 100vh div inside the flex wrapper. This could temporarily shrink the arena. R3F's resize handling changed the renderer size and camera aspect ratio; the calibrated arena only repaired these when innerWidth/innerHeight changed, so a menu-only resize could leave its 3D layer distorted relative to the background.

## Change

The menu-loading fallback now uses the same fixed overlay positioning as the menu itself, so it does not enter the arena's layout flow. Before rendering, the arena also checks its container dimensions, actual renderer size and camera aspect against the reference fit; external resizing is repaired even when the browser dimensions stay unchanged. Existing pan/zoom and camera settings remain.

The scene is keyed by engine level so a new level resets local model/animation state. Pending delayed scene-hiding timers are canceled when continuing or switching levels; a late callback also verifies its level before hiding anything.

## Changed files

- `src/components/Main.tsx`: fixed overlay for lazy menu fallback.
- `src/assets/trainingArena/createTrainingArena.ts`: restore reference fit after container/renderer/camera changes.
- `src/components/Game.tsx`: per-level scene lifecycle and safe finish timeout handling.
- `scripts/check-level-transitions.cjs`: standalone regression checks using existing TypeScript/Three dependencies.
- `docs/tasks/010-level-transition-layout.md`: this record.

## Validation

`node scripts/check-level-transitions.cjs` exercises real transitions 1->2->3->4 by collecting level food, dismissing each completion menu and resuming with a direction key. It also instantiates the actual arena factory with a canvas/renderer test surface and reproduces R3F-style size/aspect changes without a window resize. Reference size and projection recover after menu resizing, container-only resizing and repeated changes. Saving sessions is stubbed; these checks do not contact Supabase. Additional checks drive the actual Game frame callback with controlled hooks/timers: scene level keys change, stale finish callbacks cannot hide a new level, a genuine finish hides its scene, continuation restores it, and short same-level interruptions cancel their timers. These checks do not substitute for visual browser validation.

`npm run build` passed, including the extended timer checks on the continuation pass. Browser visual verification was attempted, but the native browser window did not provide usable input geometry or a screenshot (capture timed out). In-game visual verification remains pending.

## Manual checks

1. Refresh the landing, start level 1 and eat all apples. The first completion menu must not squeeze or distort the arena.
2. Dismiss the message and start moving on level 2. Background, field grid, apple and snake must stay aligned.
3. Continue through levels 3 and 4, including pause/resume, pan and zoom; verify level-local models reset correctly.
4. On a slow/throttled connection, repeat the first completion while the menu chunk loads.
5. Resize the window or change device orientation around a level transition, then continue playing; verify calibrated framing returns.
