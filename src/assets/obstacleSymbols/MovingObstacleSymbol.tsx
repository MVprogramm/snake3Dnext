import { useMemo } from 'react'
import { Shape } from 'three'
import BlinkingObstacleGlyph from './BlinkingObstacleGlyph'
import GlowingObstacleGlyph from './GlowingObstacleGlyph'

export default function MovingObstacleSymbol({ axis, direction }: { axis: 'x' | 'y'; direction: number }) {
  const chevron = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-.07, .17)
    shape.lineTo(-.015, .17)
    shape.lineTo(.09, 0)
    shape.lineTo(-.015, -.17)
    shape.lineTo(-.07, -.17)
    shape.lineTo(.035, 0)
    shape.closePath()
    return shape
  }, [])
  const rotation = axis === 'x' ? (direction < 0 ? Math.PI : 0) : (direction < 0 ? -Math.PI / 2 : Math.PI / 2)
  return (
    <group name='moving-obstacle-symbol' position={[0, 0, .025]} rotation={[0, 0, rotation]}>
      {[-.18, 0, .18].map(x => (
        <BlinkingObstacleGlyph key={x} position={[x, 0, .003]}>
          <GlowingObstacleGlyph shape={chevron} color='#2470ff' core='#e0faff' />
        </BlinkingObstacleGlyph>
      ))}
    </group>
  )
}
