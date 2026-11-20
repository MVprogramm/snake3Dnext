import { ReactNode, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group } from 'three'
import { RandomBlink } from './randomBlink'

export default function BlinkingObstacleGlyph({ children, position = [0, 0, .003] }: {
  children: ReactNode; position?: [number, number, number]
}) {
  const glyph = useRef<Group>(null)
  const blink = useMemo(() => new RandomBlink(), [])
  useFrame((_, delta) => {
    if (glyph.current) glyph.current.visible = blink.update(delta)
  })
  return <group ref={glyph} name='blinking-obstacle-glyph' position={position}>{children}</group>
}
