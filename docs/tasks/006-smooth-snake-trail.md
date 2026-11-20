# 006 - Smooth turns with existing segments

## Result

The renderer records the animated head's XY trail, rounds its corners with quadratic fillets (up to 0.4 cells), then places each visible segment one unit of arc length behind the previous one. Orientations come from the trail tangent instead of the old per-segment axial turn animation. A visual head offset of up to 0.15 cells lets the head traverse a rounded corner after the new direction is known. This offset ramps in with distance, and is visual only.

Movement, collision coordinates, food timing and the legacy animation modules remain unchanged. Existing segment taper, 125% model scale and per-segment eating lift remain. The trail is local to the mounted Snake renderer and is reset on level changes, shorter snake/reset or discontinuous head movement (including border teleports). It is bounded to the possible body length plus growth margin.

## Changed files

- `src/animations/snakeAnimation/smoothSnakeTrail.ts`: head history, rounded curve, arc-length sampling and tangent poses.
- `src/components/Snake.tsx`: use visual trail poses for existing head/body/tail refs.
- `docs/tasks/006-smooth-snake-trail.md`: this record.

## Validation

Focused TypeScript/Node checks passed for rounded 90-degree turns, bounded per-frame displacement/yaw, preserved Z lift, stationary stability, teleport reset, fast successive left/right turns at speeds 1/3/5, and growth without moving existing rendered segments. Browser visual verification remains pending.

## Manual checks

1. Move straight and turn left/right: check the head follows an arc and each body segment passes through that same bend.
2. Grow the snake, then make several successive turns and S-shaped paths at low and maximum speed; check spacing and tail continuity.
3. Eat an apple during/after a turn: check the raised head/body animation, mouth and food disappearance timing with the small visual offset.
4. Pause in the middle of a bend and resume: no drifting or spinning in place should occur.
5. Hit a border/obstacle and turn away; restart and switch levels. Check there is no stale trail.
6. Activate border wrapping: verify the trail resets rather than stretching across the arena.
