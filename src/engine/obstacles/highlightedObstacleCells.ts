import { getObstaclesFixCoord } from './obstaclesFix'
import { getObstaclesXCoord } from './obstaclesX'
import { getObstaclesYCoord } from './obstaclesY'

type Axis = 'x' | 'y'
const highlighted: Record<Axis, number[][] | null> = { x: null, y: null }
export function hasHighlightedObstacleSnapshot(): boolean {
  return highlighted.x !== null && highlighted.y !== null
}

export function resetHighlightedObstacleCells(): void {
  highlighted.x = null
  highlighted.y = null
}

// The centre chevron determines the occupied cell, not the next engine target.
export function setMovingObstacleVisualPositions(axis: Axis, positions: number[][]): void {
  highlighted[axis] = positions.map(([x, y]) => [Math.floor(x + .5), Math.floor(y + .5)])
}

export function getMovingHighlightedCells(axis: Axis): number[][] {
  const targets = axis === 'x' ? getObstaclesXCoord() : getObstaclesYCoord()
  const cells = highlighted[axis]
  return (cells && cells.length === targets.length ? cells : targets).map(cell => [...cell])
}

export function getHighlightedObstacleCells(): number[][] {
  return [...getObstaclesFixCoord(), ...getMovingHighlightedCells('x'), ...getMovingHighlightedCells('y')]
}
