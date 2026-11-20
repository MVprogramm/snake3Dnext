# 018 - Hide scene displays individually by image attachment

Replace the collective following-camera visibility rule. Capture each display's
calibrated centre as a normalized attachment point in the reference image.
Each frame map that point to the viewport using image scale, manual pan and
the following camera's backdrop shift. Hide only the display whose attachment
point leaves the screen; restore it immediately when the point re-enters.
The rule also works in the arena's rotated local viewport coordinates.
DOM information panels and gameplay are unchanged.

Changed files: `createTrainingArena.ts`, `check-level-transitions.cjs`, this record.

Validation: `node scripts/check-level-transitions.cjs` checks per-display attachment
visibility at normal, intermediate and maximum zoom, after camera return and in
rotated mode; intermediate zoom retains some displays while hiding others.
Run `npm.cmd run build`.

Manual checks: slowly zoom and pan across each display's reference-image centre.
Confirm each display hides only when its own centre leaves the screen, returns
when it re-enters, and behaves the same while following and after screen rotation.
