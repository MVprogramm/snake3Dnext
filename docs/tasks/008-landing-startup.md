# 008 - Load landing before the 3D game

## Cause and change

Previously `/` dynamically loaded SnakeGame immediately. SnakeGame initialized the engine and mounted Main, whose ArenaViewport created the WebGL arena under the landing overlay. That made refresh of the landing also load models and prepare the full scene/shadows. The session-history repository additionally had a static dependency on trainingMode, bringing game modules into the landing graph.

The start-screen markup/auth UI is now a reusable LandingPage with an onStart callback. The home route renders it directly and mounts the dynamically imported SnakeGame only after a start button is clicked or a `?play` URL is detected. SnakeGame accepts autoStart to open the selected game after initialization. Classic startup removes training mode/speed params as before; direct cabinet/training URLs retain their params. The repository imports trainingMode only when saving a game, so reading history does not load the runtime.

## Changed files

- `app/page.tsx`: landing-first route and delayed game mounting.
- `src/components/LandingPage.tsx`: extracted existing landing markup and auth UI.
- `src/components/Menu.tsx`: reuse LandingPage for the legacy start menu; pause/game-over behavior retained.
- `src/components/SnakeGame.tsx`: autoStart after initialization.
- `src/services/gameSessionRepository.ts`: remove static runtime dependency from history loading.
- `docs/tasks/008-landing-startup.md`: this record.

## Validation

Static import graph check passed: LandingPage has no Three.js, React Three Fiber or game runtime imports. Baseline warm localhost response was about 0.08 seconds; game assets transferred locally within about 0.02 seconds, so these checks did not indicate a network bottleneck. Browser startup/GPU timings were not measured; no numeric speedup is claimed.

An isolated production-server smoke check passed: landing markup is present in the HTML response, initial script bodies contain no WebGLRenderer or game-asset URLs, and the direct training URL returns HTTP 200. `npm run build` passed. Interactive startup still needs the browser checks below.

## Manual checks

1. Refresh `/` with browser cache disabled: the landing should appear without waiting for the arena. Network should show no sport-snake.glb, green-apple.glb or reference-arena.png before starting.
2. Click either start button: the game should load and open once, using classic mode. Verify movement, food, pause/resume and game-over.
3. Open `/?play=1&mode=training&speed=3&level=2`: confirm direct training startup at the selected level/speed.
4. Return home and refresh: landing remains the first screen, without the 3D scene underneath it.
5. Check login/account links and session history; confirm completed games still save their original classic/training mode.
