import arena from './arena.json'

export function isPlayableCell(x: number, y: number): boolean {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 1 || y < 1 ||
      x > arena.columns || y > arena.rows) return false
  const { width, depth, cornerCut, scaleX, scaleY } = arena.surface
  // The farthest cell corner must stay inside all four diagonal cuts.
  const edgeX = (Math.abs(x - (arena.columns + 1) / 2) + .5) * arena.cellSize
  const edgeY = (Math.abs(y - (arena.rows + 1) / 2) + .5) * arena.cellSize
  const insetX = width * scaleX / 2 - edgeX
  const insetY = depth * scaleY / 2 - edgeY
  return insetX >= -1e-9 && insetY >= -1e-9 &&
    insetX / scaleX + insetY / scaleY >= cornerCut - 1e-9
}

export function getPlayableCells(): [number, number][] {
  const cells: [number, number][] = []
  for (let x = 1; x <= arena.columns; x++)
    for (let y = 1; y <= arena.rows; y++)
      if (isPlayableCell(x, y)) cells.push([x, y])
  return cells
}

export function toFieldScene([x, y]: number[]): [number, number] {
  return [x - (arena.columns + 1) / 2, y - (arena.rows + 1) / 2]
}

// A bonus crosses to the opposite playable end of the same row or column.
export function getBorderDestination(x: number, y: number, dx: number, dy: number): [number, number] | null {
  const cells = getPlayableCells().filter(cell => dx ? cell[1] === y : cell[0] === x)
  if (!cells.length) return null
  return dx > 0 || dy > 0 ? cells[0] : cells[cells.length - 1]
}
