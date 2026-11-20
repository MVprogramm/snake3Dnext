# 005 - Eating lift for elevated apple

## Change

The rendered head now targets apple height + 0.15 cells (currently 1.15 cells), replacing the former 0.5-cell lift. Response scales with movement speed so fast approaches can reach the elevated apple. Each following segment smoothly follows 95% of its predecessor's previous-frame height instead of being forced to zero. This produces a delayed rise and descent through the body and tail; horizontal motion and food/collision timing are unchanged.

## Changed files

- `src/animations/snakeAnimation/bodyAnimations/snakeEatingLift.ts`: shared height/response and propagation calculation.
- `src/animations/snakeAnimation/bodyAnimations/snakeBodyMoving.ts`: apply heights to visible units.
- `src/animations/snakeAnimation/headAnimations/snakeHeadMoving.ts`: keep head animation coordinates consistent with the lift.
- `docs/tasks/005-eating-lift.md`: this record.

## Validation

Focused calculation checks passed at speeds 1, 3 and 5: head reaches the target, followers rise with a delay, heights taper toward the tail, all settle back to zero and delta=0 keeps the pose unchanged. In-game visual verification remains pending.

## Manual checks

1. Approach an apple straight on at low and maximum speeds, then from all four directions. Check the head reaches apple height and the apple does not protrude through its top before disappearing.
2. Grow the snake and collect more apples: body and tail should rise after the head, then settle smoothly without snapping to the floor.
3. Collect an apple immediately after a turn; check head/body connections and mouth closure.
4. Pause while raised, resume, and restart after a collision; check for stuck heights and proper reset.
