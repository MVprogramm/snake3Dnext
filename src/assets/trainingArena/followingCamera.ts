import { PerspectiveCamera, Vector3 } from 'three'

type Viewport = { width: number; height: number; imageWidth: number; imageHeight: number; panX: number; panY: number }

// Keep the calibrated camera untouched. Both cameras share its projection;
// following only translates parallel to the image, without orbiting or rolling.
export class FollowingCamera {
  readonly camera = new PerspectiveCamera()
  active = false
  readonly offset = new Vector3()
  private desired = new Vector3()
  private right = new Vector3()
  private up = new Vector3()
  private point = new Vector3()
  private justActivated = false

  private screen(point: Vector3, fixed: PerspectiveCamera, view: Viewport) {
    this.point.copy(point).project(fixed)
    return {
      x: view.width / 2 + this.point.x * view.imageWidth / 2 + view.panX,
      y: view.height / 2 - this.point.y * view.imageHeight / 2 + view.panY,
    }
  }

  update(fixed: PerspectiveCamera, outline: Vector3[], head: Vector3 | null, view: Viewport, delta: number, reset = false, forceFollowing = false) {
    if (reset) this.offset.set(0, 0, 0)
    const overflow = forceFollowing || outline.some(vertex => {
      const { x, y } = this.screen(vertex, fixed, view)
      return x < -1 || y < -1 || x > view.width + 1 || y > view.height + 1
    })
    this.justActivated = overflow && !this.active
    this.active = overflow
    this.desired.set(0, 0, 0)
    if (overflow && head) {
      const { x, y } = this.screen(head, fixed, view)
      // A central dead zone preserves the inherited framing at handover.
      const dx = x - Math.max(view.width * .25, Math.min(view.width * .75, x))
      const dy = y - Math.max(view.height * .25, Math.min(view.height * .75, y))
      const depth = -this.point.copy(head).applyMatrix4(fixed.matrixWorldInverse).z
      const worldPerPixelX = 2 * depth / (fixed.projectionMatrix.elements[0] * view.imageWidth)
      const worldPerPixelY = 2 * depth / (fixed.projectionMatrix.elements[5] * view.imageHeight)
      this.right.set(1, 0, 0).applyQuaternion(fixed.quaternion)
      this.up.set(0, 1, 0).applyQuaternion(fixed.quaternion)
      this.desired.addScaledVector(this.right, dx * worldPerPixelX)
        .addScaledVector(this.up, -dy * worldPerPixelY)
    }
    // First following frame is an exact copy, including during a large zoom step.
    if (!this.justActivated) this.offset.lerp(this.desired, 1 - Math.exp(-6 * Math.min(Math.max(delta, 0), .1)))
    if (!overflow && this.offset.lengthSq() < 1e-8) this.offset.set(0, 0, 0)
    this.camera.copy(fixed)
    this.camera.position.add(this.offset)
    this.camera.updateMatrixWorld(true)
    return this.camera
  }
}
