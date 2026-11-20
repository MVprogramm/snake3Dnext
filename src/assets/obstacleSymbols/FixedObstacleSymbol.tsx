import { useMemo } from 'react'
import { Shape } from 'three'
import ObstacleCellFrame from './ObstacleCellFrame'
import BlinkingObstacleGlyph from './BlinkingObstacleGlyph'
import GlowingObstacleGlyph from './GlowingObstacleGlyph'

// A floor marking in gameplay XY coordinates: 80% of one cell.
export default function FixedObstacleSymbol() {
  const bolt = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(.035, .27)
    shape.lineTo(-.18, -.035)
    shape.lineTo(-.035, -.035)
    shape.lineTo(-.09, -.27)
    shape.lineTo(.18, .065)
    shape.lineTo(.035, .065)
    shape.lineTo(.09, .27)
    shape.closePath()
    return shape
  }, [])

  return (
    <group name='fixed-obstacle-symbol'>
      <ObstacleCellFrame color='#39ff14' />
      <BlinkingObstacleGlyph position={[0, 0, .028]}>
        <GlowingObstacleGlyph shape={bolt} color='#39ff14' core='#d8ffe8' />
      </BlinkingObstacleGlyph>
    </group>
  )
}
