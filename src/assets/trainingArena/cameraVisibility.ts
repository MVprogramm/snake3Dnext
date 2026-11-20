import { Box3, Camera, Frustum, Matrix4, Object3D, Vector3 } from 'three'

export function createCameraVisibilityCheck() {
  const bounds = new Box3()
  const frustum = new Frustum()
  const projection = new Matrix4()
  const centre = new Vector3()
  return (object: Object3D | undefined, camera: Camera): boolean => {
    if (!object) return false
    for (let parent: Object3D | null = object; parent; parent = parent.parent) {
      if (!parent.visible) return false
    }
    bounds.setFromObject(object)
    if (bounds.isEmpty()) return false
    projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(projection)
    bounds.getCenter(centre)
    if (!frustum.containsPoint(centre)) return false
    centre.applyMatrix4(projection)
    // Keep guidance until the apple centre clears a 10% margin at each edge,
    // rather than hiding on the first leaf/bounds intersection with the frame.
    return Math.abs(centre.x) <= .8 && Math.abs(centre.y) <= .8
  }
}
