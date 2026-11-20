# 028 - Block reverse input after obstacle contact

Capture the actual incoming heading before collision handling zeroes the head's
step. Reject its opposite direction before input changes animation direction,
starts the timer or appends a move. Do not rely on the most recent protocol move:
it may refer to a queued turn, and a short snake's collision-body slice omits
the neck/tail that normally blocks reversing.

Keep the collision-heading guard through rapid keys until a legal next step is
planned. Clear it when movement resumes or a level starts. Use independent state
from the speed-stop direction so moving-obstacle protection is unchanged.
Exclude the prohibited reverse from the no-moves calculation as well.

Changed files:
- `src/engine/snake/snake.ts`
- `src/engine/events/isContact.ts`
- `src/engine/events/changeDirectionEvent.ts`
- `src/engine/events/noMovesEvent.ts`
- `src/engine/snake/advanceSnake.ts`
- `src/engine/protocol/startLevel.ts`
- `scripts/check-contact-reverse.cjs`
- this record.

Validation: `node scripts/check-contact-reverse.cjs` drives actual contacts with
fixed/X/Y obstacles from all four directions, including a logged heading that
differs from the real heading. It checks repeated reverse rejection, unchanged
timer/body/protocol, rapid keys after a permitted turn, valid movement resume,
distinct short-snake cells, no-moves and restart reset.
Run `node scripts/check-level-transitions.cjs`,
`node scripts/check-moving-symbols.cjs`, and `npm.cmd run build`.

Manual checks: hit a fixed and a moving obstacle with a short snake. Press the
opposite arrow repeatedly (or swipe back): the snake stays stopped with its tail
intact. Choose a free perpendicular direction: movement resumes. Repeat from all
directions, with rapid keys and after a level change/restart.
