# 004 - SportSnake model

## Result

Replaced rendered head, body segments and tail with parts exported from the user's `SportSnake_Optimized.blend`. Old model modules remain in place. Source Blender files are read-only inputs and are never saved by the exporter.

The game asset contains only SportHead, SportBody and SportTail. Blender controller shapes, guides, studio lights and references are excluded. Neutral transforms are baked; the lower jaw retains a JawPivot and the tongue retains Extend, Sway_Left and Sway_Right morph targets. Export uses installed Blender 5.2; the source has a newer file version, so the exported asset is checked independently rather than relying on live Blender drivers in the game.

The head is sized to approximately one grid cell wide. Body and tail keep the source cross-section ratio; their longitudinal dimensions are fitted to consecutive game positions (1.04 and 1.12 cells). Existing movement, growth, unit taper and rotation callbacks remain. The head adapter reads the existing food animation state to drive head pitch, jaw opening up to 65 degrees and tongue morphs. It does not modify collisions, food timing or the engine.

## Changed files

- `public/sport-snake.glb`: exported game model.
- `scripts/export-sport-snake.py`: reproducible export from an opened source .blend.
- `src/assets/sportSnake/SportSnakePart.tsx`: parts, shadows and head animation adapter.
- `src/components/Snake.tsx`: replace the rendered parts.
- `docs/tasks/004-sport-snake-model.md`: this record and manual checks.

## Validation

Three.js GLTFLoader check passed: only three gameplay roots, model bounds and ground clearance, jaw pivot, all three tongue morphs and independent morph state on clones. An offline Blender render of the exported GLB was inspected for silhouette, colors, eye placement and part connections. In-game browser verification remains pending.

## Manual checks

1. Start or restart the game: check red/peach snake, eye direction, floor clearance and shadows.
2. Move and turn in all four directions at low and high speeds: check the head orientation and connections at corners.
3. Collect several apples: check head lift, jaw opening/closing, tongue, disappearance of food and new body segments.
4. Pause/resume, collide with an obstacle or border, and restart: check the pose resets and there is no old jaw left in the scene.
5. Advance to another level and pan/zoom: check all parts stay aligned and no Blender guides/controllers appear.

## Non-goals

No engine behavior changes, new dependencies, old asset deletion, or Blender UI controller port.
