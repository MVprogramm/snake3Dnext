# 026 - Shared animated obstacle style

Use the same thick solid ring and soft glow style for fixed and moving
obstacles. Following the reference palette, fixed signs use green rings/glow
and pale green-white lightning; moving signs use blue rings/glow and pale
blue-white chevrons. Both use a shared stationary ring component. Dashed outlines
and ring rotation were removed at the user's request. Restore the brighter
continuous halo; keep local coloured lighting and central glyph blinking.

Blink the fixed lightning glyph at random intervals. Each of the three moving
chevrons owns a separate blink schedule: visible pauses of 0.7–2.5 seconds and
brief dark flashes of 0.09–0.22 seconds, with randomized initial delay. Rings
remain visible while glyphs blink. Animation updates refs in useFrame without
React state updates or browser timers. Collision, movement, level data and
direction handling are unchanged.

The reference-colour signs also emit light: a stronger additive floor halo spans
2.2 cells with a soft fade, and a matching local point light illuminates nearby
snake models. The floor uses an unlit reference material, so its light spill is
drawn by the halo. Point lights have limited range and no shadow maps. Ring shape,
glyph blinking, movement and collision behavior are unchanged.

Changed files: `AnimatedObstacleRing.tsx`, `BlinkingObstacleGlyph.tsx`,
`randomBlink.ts`, `FixedObstacleSymbol.tsx`, `MovingObstacleSymbol.tsx` under
`src/assets/obstacleSymbols/`; `scripts/check-obstacle-animation.cjs`,
`scripts/check-moving-symbols.cjs`, this record.
Lighting update changes `src/assets/obstacleSymbols/ObstacleGlow.tsx` and this record.

Validation: `node scripts/check-obstacle-animation.cjs` checks random intervals,
independent actual glyph wrappers and a solid ring without a rotation callback.
Run `node scripts/check-moving-symbols.cjs`,
`node scripts/check-level-transitions.cjs`, and `npm.cmd run build`.

Manual checks: compare fixed/moving ring style on level one. Check stationary solid rings,
irregular lightning blinking and independent chevrons. Check chevrons still point
along movement after bounce, plus 400%, screen rotation and level restart.
