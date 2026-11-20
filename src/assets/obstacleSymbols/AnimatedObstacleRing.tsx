export default function AnimatedObstacleRing({ color = '#72fff0' }: { color?: string }) {
  return (
    <group name='screen-round-obstacle' position={[0, 0, .002]}>
      <mesh name='obstacle-ring'>
        <ringGeometry args={[.31, .4, 64]} />
        <meshBasicMaterial color={color} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
