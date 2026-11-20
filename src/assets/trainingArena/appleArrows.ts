import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshBasicMaterial } from 'three'
import arena from '../../engine/field/arena.json'
import { isPlayableCell, toFieldScene } from '../../engine/field/fieldGeometry'
import type { FoodOffset } from '../../engine/food/getFoodOffset'

export function getAnimatedFoodOffset(head: readonly number[] | undefined, food: number[] | undefined): FoodOffset | null {
  if (!head || !food) return null
  const [x, y] = toFieldScene(food)
  const dx = x - head[0], dy = y - head[1]
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null
  return { x: Math.abs(dx) < 1e-4 ? 0 : dx, y: Math.abs(dy) < 1e-4 ? 0 : dy }
}

// Flat cyan stencils like the lane markings on the reference play surface.
export function createAppleArrows() {
  // Nearly cell-sized silhouette with a broad shaft. Each dash is a flat quad,
  // so its thickness remains visible without relying on WebGL line widths.
  const outline = [[-.46, -.22], [.08, -.22], [.08, -.45], [.46, 0],
    [.08, .45], [.08, .22], [-.46, .22]]
  const positions: number[] = []
  for (let edge = 0; edge < outline.length; edge++) {
    const [ax, ay] = outline[edge]
    const [bx, by] = outline[(edge + 1) % outline.length]
    const dx = bx - ax, dy = by - ay
    const length = Math.hypot(dx, dy)
    const count = Math.max(1, Math.round(length / .14))
    const nx = -dy / length * .022, ny = dx / length * .022
    for (let dash = 0; dash < count; dash++) {
      const start = (dash + .18) / count, end = (dash + .82) / count
      const x1 = ax + dx * start, y1 = ay + dy * start
      const x2 = ax + dx * end, y2 = ay + dy * end
      positions.push(x1-nx,y1-ny,0, x2-nx,y2-ny,0, x2+nx,y2+ny,0,
        x1-nx,y1-ny,0, x2+nx,y2+ny,0, x1+nx,y1+ny,0)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  const material = new MeshBasicMaterial({
    color: '#a8ffeb', transparent: true, opacity: .9,
    depthWrite: false, toneMapped: false,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  })
  const group = new Group()
  group.name = 'apple-distance-arrows'
  group.visible = false
  const horizontal = new Mesh(geometry, material)
  const vertical = new Mesh(geometry, material)
  horizontal.name = 'apple-horizontal-arrow'
  vertical.name = 'apple-vertical-arrow'
  group.add(horizontal, vertical)

  function update(head: readonly number[] | undefined, cell: readonly number[] | undefined, offset: FoodOffset | null, enabled: boolean) {
    group.visible = enabled && !!head && !!cell && !!offset
    if (!group.visible || !head || !cell || !offset) return
    // Both axes use the same length scale so equal cell distances look equal.
    const maxDistance = Math.max(arena.columns - 1, arena.rows - 1, 1)
    const used = new Set<string>()
    for (const [mesh, distance, axis] of [[horizontal, offset.x, 0], [vertical, offset.y, 1]] as const) {
      mesh.visible = distance !== 0
      if (!mesh.visible) continue
      const sign = Math.sign(distance)
      const preferred: [number, number] = axis === 0 ? [sign, 0] : [0, sign]
      const candidates: [number, number][] = [preferred, [0, 1], [1, 0], [0, -1], [-1, 0]]
      const neighbour = candidates.find(([x, y]) =>
        !used.has(`${x}:${y}`) && isPlayableCell(cell[0] + x, cell[1] + y))
      if (!neighbour) { mesh.visible = false; continue }
      used.add(`${neighbour[0]}:${neighbour[1]}`)
      mesh.position.set(head[0] + neighbour[0], head[1] + neighbour[1], .035)
      mesh.rotation.z = axis === 0 ? (sign > 0 ? 0 : Math.PI) : sign * Math.PI / 2
      mesh.scale.set(.20 + .80 * Math.min(Math.abs(distance) / maxDistance, 1), 1, 1)
    }
  }
  return { group, update }
}
