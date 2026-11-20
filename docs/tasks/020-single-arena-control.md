# 020 - One arena control for zoom and close-up

During gameplay show only the existing pan/zoom button. Keep the unused home,
training and debug UI modules on disk, but stop mounting their overlays here.
Remove the separate close-up button.

Normal drag keeps the 160% cap. An attempted zoom beyond that cap changes the
button from arrows to a magnifier without enlarging the field. Discard drag
overshoot so reversing immediately zooms out and restores the arrows. Panning at
the cap remains available. A single tap on the magnifier does nothing; a double
click or double touch tap within 500 ms enters close-up at 400%.

Close-up shows a cross instead of arrows and does not drag the view. A double
click/tap exits to 160% with the saved normal pan; a single click keeps close-up active. Dragging must never count as a
click or exit close-up. Cancellation and lost capture do not activate modes.
Keyboard or assistive button activation can enter from the magnifier or exit.
Keep mode-specific camera, panel and decorative-display behavior from task 019.

Changed files: `ArenaViewport.tsx`, `Main.tsx`, `createTrainingArena.ts`,
`trainingArena.css`, `check-level-transitions.cjs`, this record.

Validation: `node scripts/check-level-transitions.cjs` exercises the cap, immediate
reverse after overshoot, icon states, single/double mouse clicks, touch double
tap, drag rejection, 160% return, rotated modes, viewport rendering and transitions.
Run `npm.cmd run build`.

Manual checks: drag to 160% and beyond; verify magnifier and unchanged image size.
Reverse the same drag and check immediate zoom-out. Double-click the magnifier
to enter; double-click the cross to return to 160%. Repeat on touch and after
90-degree rotation. Verify menus still work and gameplay does not restart.
