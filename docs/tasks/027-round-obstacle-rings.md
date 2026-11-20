# 027 - Keep obstacle rings round on screen

Compensate the field's unequal axis scaling and perspective for the circular ring
and glow only. A shared marked wrapper uses the inverse local projection
Jacobian, with a size bounded by the smaller projected cell dimension. This keeps
the sign on the floor and at its original centre while making its circle round
in screen pixels. Its child ring still rotates; glyph direction, blinking,
obstacle movement and collision coordinates are unchanged.

Apply correction using the actual cropped render camera each frame, including
the following camera. Recalculate from the parent transform, never from the prior
correction, to avoid accumulation. No new libraries or billboard objects.

Changed files: `screenRoundSymbols.ts`, `AnimatedObstacleRing.tsx`, `ObstacleGlow.tsx`
under `src/assets/obstacleSymbols/`; `createTrainingArena.ts`,
`scripts/check-round-symbols.cjs`, `scripts/check-obstacle-animation.cjs`, this record.

Validation: `node scripts/check-round-symbols.cjs` checks projected circularity
within 2% across field positions, four headings, ring spin, camera tracking and
viewport ratios; unchanged centres/headings/floor plane and no accumulation.
Also run `node scripts/check-obstacle-animation.cjs`,
`node scripts/check-moving-symbols.cjs`, `node scripts/check-level-transitions.cjs`,
and `npm.cmd run build`.

Manual checks: compare circles in the near/far corners and centre in normal/400%
mode. Watch rotation and bounces; resize and rotate the screen. Verify glow also
stays round and glyphs still indicate the correct movement direction.
