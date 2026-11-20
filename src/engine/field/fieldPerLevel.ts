import arena from './arena.json'

// Compatibility name retained for existing modules. The field is shared by all levels.
export function getField(): number { return arena.columns }
export function getFieldRows(): number { return arena.rows }
