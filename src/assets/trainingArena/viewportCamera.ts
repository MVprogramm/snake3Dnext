import { PerspectiveCamera } from 'three'

// Render the visible rectangle of the virtual reference image at screen size.
// Keep the source projection intact for calibration and snake-following math.
export function cropCameraToViewport(
  target: PerspectiveCamera,
  source: PerspectiveCamera,
  imageWidth: number,
  imageHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  panX: number,
  panY: number,
) {
  target.copy(source)
  target.setViewOffset(imageWidth, imageHeight,
    (imageWidth - viewportWidth) / 2 - panX,
    (imageHeight - viewportHeight) / 2 - panY,
    viewportWidth, viewportHeight)
  // setViewOffset overwrites aspect; retain the source calibration even when
  // reference dimensions have been rounded to whole pixels.
  target.aspect = source.aspect
  target.updateProjectionMatrix()
  target.updateMatrixWorld(true)
  return target
}
