import { Camera, Matrix4, Object3D, Vector3 } from 'three'

// Keep circular floor markings round in screen pixels without billboarding
// or changing the parent obstacle, its centre, or the central glyph direction.
export function createScreenRoundCorrection() {
  const centre = new Vector3(), x = new Vector3(), y = new Vector3()
  const base = new Matrix4()
  return (root: Object3D, camera: Camera, width: number, height: number) => {
    root.traverse(object => {
      if (object.name !== 'screen-round-obstacle' || !object.parent) return
      base.copy(object.parent.matrixWorld)
      centre.copy(object.position).applyMatrix4(base).project(camera)
      x.copy(object.position); x.x += .001; x.applyMatrix4(base).project(camera)
      y.copy(object.position); y.y += .001; y.applyMatrix4(base).project(camera)
      const ax = (x.x - centre.x) * width * 500, ay = (x.y - centre.y) * height * 500
      const bx = (y.x - centre.x) * width * 500, by = (y.y - centre.y) * height * 500
      const determinant = ax * by - ay * bx
      const a2 = ax * ax + ay * ay, b2 = bx * bx + by * by, dot = ax * bx + ay * by
      if (Math.abs(determinant) < 1e-8 || a2 < 1e-8) return
      // Smallest singular value keeps the corrected ring within the cell footprint.
      const scale = Math.sqrt(Math.max(0, (a2 + b2 - Math.hypot(a2 - b2, 2 * dot)) / 2))
      const ux = ax / Math.sqrt(a2) * scale, uy = ay / Math.sqrt(a2) * scale
      const vx = -uy * Math.sign(determinant), vy = ux * Math.sign(determinant)
      object.matrixAutoUpdate = false
      object.matrix.set(
        (by * ux - bx * uy) / determinant, (by * vx - bx * vy) / determinant, 0, object.position.x,
        (-ay * ux + ax * uy) / determinant, (-ay * vx + ax * vy) / determinant, 0, object.position.y,
        0, 0, 1, object.position.z,
        0, 0, 0, 1,
      )
      object.updateMatrixWorld(true)
    })
  }
}
