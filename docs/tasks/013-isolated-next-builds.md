# 013 - Isolate Next.js development and production output

## Cause

A running development server and repeated production validation builds both used `.next`. The build replaced files/manifests that the dev server still referenced, resulting in HTTP 500 and errors such as Cannot find module './682.js', /_document or /_not-found. The screenshot stack includes the dev hot reloader, confirming that the failing server was using development output.

## Fix

`next.config.mjs` chooses `.next-dev` for PHASE_DEVELOPMENT_SERVER and `.next` for production build/start. The new dev directory is git-ignored. Next automatically added `.next-dev/types/**/*.ts` to tsconfig include paths. The dev server restarted on the config change and rebuilt its isolated output; no source/assets or generated directories were deleted.

## Changed files

- `next.config.mjs`: phase-specific output directory.
- `.gitignore`: ignore `.next-dev`.
- `tsconfig.json`: Next-generated development type include.
- `docs/tasks/013-isolated-next-builds.md`: this record.

## Verification

Config checks confirm dev and production directories differ, while production build/start agree. During a production build, the running dev server returned HTTP 200 for the landing and direct-play route; every initial JavaScript URL returned HTTP 200. Cold dev compilation took about 18 seconds; the next local landing request took about 0.16 seconds. The production build passed. After it finished, the dev landing and its scripts still returned HTTP 200, and a missing route correctly returned HTTP 404 instead of a server error. These are local HTTP measurements, not browser paint timings.

## Manual checks

1. Reload the current game/landing tab and confirm the server error is gone.
2. Start a game and confirm models, panels and controls load.
3. Keep `npm run dev` running, execute `npm run build` in another terminal, and refresh the dev page: it should continue working.
4. For production, run `npm run build` then `npm run start` on a free port; it should use `.next`.

Gameplay and presentation settings are unchanged by this fix.
