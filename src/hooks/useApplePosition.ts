import * as React from 'react'
import { toFieldScene } from '../engine/field/fieldGeometry'
import { getFoodCoord } from '../engine/food/food'
import { Position2D, Position3D } from '../types/threeTypes'


const isValidCoord = (coord: unknown): coord is Position2D =>
  Array.isArray(coord) &&
  coord.length === 2 &&
  coord.every((value) => typeof value === 'number' && Number.isFinite(value))

/**
 * Хук для управления позицией яблока
 */
export const useApplePosition = (zLocation: number) => {
  const [position, setPosition] = React.useState<Position3D | null>(null)

  const transformCoordinates = React.useCallback(
    (coord: Position2D): Position3D => [...toFieldScene(coord), zLocation],
    [zLocation]
  )

  const positionChanged = React.useCallback(
    (prev: Position3D, next: Position3D): boolean =>
      prev[0] !== next[0] || prev[1] !== next[1],
    []
  )

  const updatePosition = React.useCallback(() => {
    const foodCoord = getFoodCoord()
    if (!isValidCoord(foodCoord)) return

    const adjustedPosition = transformCoordinates(foodCoord)
    setPosition((prev) =>
      !prev || positionChanged(prev, adjustedPosition) ? adjustedPosition : prev
    )
  }, [transformCoordinates, positionChanged])

  return { position, updatePosition }
}
