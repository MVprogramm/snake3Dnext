import { useMemo } from 'react'
import { AdditiveBlending, Color } from 'three'

const vertexShader = `
  varying vec2 cellUv;
  void main() {
    cellUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const fragmentShader = `
  uniform vec3 frameColor;
  varying vec2 cellUv;
  void main() {
    vec2 p = abs((cellUv - 0.5) * 1.4);
    float distanceToEdge = abs(max(p.x, p.y) - 0.5);
    float glow = exp(-pow(distanceToEdge / 0.075, 2.0));
    gl_FragColor = vec4(frameColor, glow * 0.65);
    #include <colorspace_fragment>
  }
`

// Field-local geometry: the four line centres lie exactly on the cell borders.
export default function ObstacleCellFrame({ color }: { color: string }) {
  const uniforms = useMemo(() => ({ frameColor: { value: new Color(color) } }), [color])
  return (
    <group name='obstacle-cell-frame' position={[0, 0, .025]}>
      <mesh>
        <planeGeometry args={[1.4, 1.4]} />
        <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}
          blending={AdditiveBlending} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {[[-.5, 0], [.5, 0]].map(([x, y]) => (
        <mesh key={`x${x}`} position={[x, y, .002]}>
          <planeGeometry args={[.1, 1.1]} />
          <meshBasicMaterial color={color} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {[[0, -.5], [0, .5]].map(([x, y]) => (
        <mesh key={`y${y}`} position={[x, y, .002]}>
          <planeGeometry args={[1.1, .1]} />
          <meshBasicMaterial color={color} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      <pointLight color={color} position={[0, 0, .55]} intensity={4.5} distance={3} decay={2} castShadow={false} />
    </group>
  )
}
