import type { FoodOffset } from '../../engine/food/getFoodOffset'

export function formatAppleOffset(offset: FoodOffset | null, rotated: boolean): string {
  if (!offset) return '→ —\n↑ —'
  // Clockwise 90°: grid up becomes screen right; grid right becomes screen down.
  const right = rotated ? offset.y : offset.x
  const up = rotated ? -offset.x : offset.y
  const signed = (value: number) => value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '0'
  return `→ ${signed(right)}\n↑ ${signed(up)}`
}
