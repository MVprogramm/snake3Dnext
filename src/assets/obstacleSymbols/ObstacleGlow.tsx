import { useMemo } from 'react'
import { AdditiveBlending, Color } from 'three'

const vertexShader = `
  varying vec2 symbolUv;
  void main() {
    symbolUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const fragmentShader = `
  uniform vec3 glowColor;
  varying vec2 symbolUv;
  void main() {
    float radius = length((symbolUv - 0.5) * 2.2);
    float ring = exp(-pow((radius - 0.375) / 0.06, 2.0));
    float haze = exp(-radius * radius / 0.24);
    float fade = 1.0 - smoothstep(0.85, 1.1, radius);
    gl_FragColor = vec4(glowColor, min(0.95, (0.65 * ring + 0.3 * haze) * fade));
    #include <colorspace_fragment>
  }
`

export default function ObstacleGlow({ color }: { color: string }) {
  const uniforms = useMemo(() => ({ glowColor: { value: new Color(color) } }), [color])
  return (
    <>
      <group name='screen-round-obstacle'>
        <mesh>
          <planeGeometry args={[2.2, 2.2]} />
          <shaderMaterial uniforms={uniforms} vertexShader={vertexShader}
            fragmentShader={fragmentShader} blending={AdditiveBlending}
            transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <pointLight color={color} position={[0, 0, .55]} intensity={3} distance={3} decay={2} castShadow={false} />
    </>
  )
}
