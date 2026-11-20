export type InfoOrientation = 'vertical' | 'horizontal'

type ArenaBounds = {
  viewportWidth: number
  viewportHeight: number
  imageWidth: number
  imageHeight: number
  panX: number
  panY: number
  rotated: boolean
}

export function getInfoLayout(bounds: ArenaBounds, previous: InfoOrientation = 'vertical') {
  const { viewportWidth, viewportHeight, rotated, panX, panY } = bounds
  const width = rotated ? bounds.imageHeight : bounds.imageWidth
  const height = rotated ? bounds.imageWidth : bounds.imageHeight
  const x = rotated ? -panY : panX
  const y = rotated ? panX : panY
  const screenGaps = {
    left: Math.max(0, (viewportWidth - width) / 2 + x),
    right: Math.max(0, (viewportWidth - width) / 2 - x),
    top: Math.max(0, (viewportHeight - height) / 2 + y),
    bottom: Math.max(0, (viewportHeight - height) / 2 - y),
  }
  // Panels rotate with the arena. Map screen margins back to its local edges:
  // local left -> screen top, right -> bottom, top -> right, bottom -> left.
  const gaps = rotated ? {
    left: screenGaps.top,
    right: screenGaps.bottom,
    top: screenGaps.right,
    bottom: screenGaps.left,
  } : screenGaps
  const sideSpace = gaps.left + gaps.right
  const verticalSpace = gaps.top + gaps.bottom
  // Full coverage always returns the indicators to the sides.
  const orientation: InfoOrientation = sideSpace <= 1 && verticalSpace <= 1 ? 'vertical'
    : verticalSpace > sideSpace + 1 ? 'horizontal'
    : sideSpace > verticalSpace + 1 ? 'vertical' : previous
  return { orientation, gaps, screenGaps }
}
