# 023 - Rapidly decay the eating bend

Preserve the head's apple-reaching height. Limit body lift to the first four
segments after the head, using a cubic spatial taper that reaches the floor at
the fifth body segment. Do not apply pitch clearance to grounded later segments,
which would otherwise lift them again. Short snakes still ground their last
visible segment, including the initial head/tail pair.

The source animation also stops propagating height beyond four body segments
and attenuates each follower more strongly. Horizontal trail rounding and the
transverse body wave remain unchanged. Engine gameplay rules are unchanged.

Changed files: `src/animations/snakeAnimation/smoothSnakeTrail.ts`,
`src/animations/snakeAnimation/bodyAnimations/snakeEatingLift.ts`,
`scripts/check-eating-decay.cjs`, `scripts/check-snake-wave.cjs`, this record.

Validation: `node scripts/check-eating-decay.cjs` covers 1/2/3/8/20 visible parts
at speeds 1/3/5, head reach, rapid taper, grounded later parts and grounded tail.
Run `node scripts/check-snake-wave.cjs`,
`node scripts/check-level-transitions.cjs`, and `npm.cmd run build`.

Manual checks: eat the first apple and check the tail stays down; on a long snake
eat while moving straight and turning at low/high speed. Only the head and at
most four following body segments may rise, with the fourth nearly grounded.
Check the transverse wave, pause/resume and a level transition.
