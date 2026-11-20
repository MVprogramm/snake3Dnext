import { AdditiveBlending, Shape } from 'three'

export default function GlowingObstacleGlyph({ shape, color, core }: { shape: Shape; color: string; core: string }) {
  return <group>
    {[{ scale: 1.65, opacity: .07 }, { scale: 1.35, opacity: .16 }, { scale: 1.15, opacity: .3 }].map(layer => (
      <mesh key={layer.scale} scale={[layer.scale, layer.scale, 1]}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial color={color} transparent opacity={layer.opacity} blending={AdditiveBlending}
          depthWrite={false} toneMapped={false} />
      </mesh>
    ))}
    <mesh position={[0, 0, .001]}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color={core} depthWrite={false} toneMapped={false} />
    </mesh>
  </group>
}
