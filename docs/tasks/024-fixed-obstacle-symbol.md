# 024 - Amber floor symbol for fixed obstacles

Replace the visuals of all fixed obstacle variants (`fix`, `fix-M`, `fix-R`) with
a flat amber circle and a bright lightning bolt centred on the same grid cell.
Ring diameter is 0.8 cell units. A static radial shader adds a soft glow without
bloom, external textures, new libraries or pulsing. The marking lies just above
the field in gameplay XY coordinates and follows the existing arena projection.

Preserve the existing moving obstacle rendering and movement, level data,
collision rules and obstacle coordinate arrays. Old mushroom, rock and hedgehog
model modules remain on disk. R3F owns the new geometries/materials for cleanup.

Changed files: `src/assets/obstacleSymbols/FixedObstacleSymbol.tsx`,
`src/components/Obstacles.tsx`, this record.

Validation: `node scripts/check-level-transitions.cjs`, `npm.cmd run build`.
Browser visual verification remains a manual check.

Manual checks: open levels containing mushrooms and rocks and verify one amber
floor symbol per occupied cell. Check normal and 400% modes and screen rotation.
Approach a symbol to verify existing collision behavior and arrow-gap hiding.
Restart and advance a level to check placement and cleanup. Verify moving
obstacles retain their previous appearance and movement.
