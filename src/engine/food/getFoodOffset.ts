import { getSnakeHeadParams } from '../snake/snake'
import { getFoodCoord } from './food'

export type FoodOffset = { x: number; y: number }

// Grid coordinates, independent of cell size, zoom and animated head lift.
export function getFoodOffset(): FoodOffset | null {
  const head = getSnakeHeadParams()
  const food = getFoodCoord()
  if (!head || !food) return null
  const x = food[0] - head.snakeHeadCoordX
  const y = food[1] - head.snakeHeadCoordY
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null
}
