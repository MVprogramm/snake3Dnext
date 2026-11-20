# 007 - Grounded spatial eating bend

## Result

The visual trail now records and rounds XYZ head positions and samples by spatial arc length. Eating height is taken from the same sampled trail as horizontal turns instead of independent per-unit vertical offsets. A smooth grounding envelope reduces height toward the last visible segment. The tail is always explicitly set to z=0 and pitch=0, including the initial head/tail-only snake. A one-part snake also stays grounded.

Pitch comes from neighboring points on the grounded curve; yaw comes from the horizontal tangent. ZXY rotation order keeps pitch relative to the direction of travel. The model adapter no longer adds the old independent head pitch; mouth opening and tongue morphs remain. Tilted body parts receive clearance to avoid cutting their lower edge into the floor. Gameplay coordinates, collision rules and food timing are unchanged.

## Changed files

- `src/animations/snakeAnimation/smoothSnakeTrail.ts`: spatial history, fillets and arc lengths; grounded height/pitch.
- `src/components/Snake.tsx`: orient rendered segments along the spatial trail using ZXY Euler order.
- `src/assets/sportSnake/SportSnakePart.tsx`: remove additional independent head pitch.
- `docs/tasks/007-grounded-eating-trail.md`: this record.

## Validation

Focused checks passed for 1, 2, 3, 8 and 20 visible segments at speeds 1, 3 and 5: grounded flat tail at every frame, finite non-negative heights, bounded pitch, head reaching its eating height, body following, stationary stability and restart resetting height/pitch. In-game visual verification remains pending.

## Manual checks

1. Start a new game and eat the very first apple: head rises; the tail stays flat on the field for the entire action.
2. Grow a longer snake and collect several apples: the front bends upward along a smooth curve while the tail remains grounded, then the curve settles.
3. Repeat from all four directions at low and maximum speed; check the head does not receive a doubled tilt and the apple is hidden correctly.
4. Eat just after a left/right turn: horizontal and vertical bends should join without twisted segments.
5. Pause/resume while raised, collide, restart and change level: check for floating tails or stale elevated poses.
