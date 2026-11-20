import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Vector2 } from 'three'
import arena from '../engine/field/arena.json'
import { toFieldScene } from '../engine/field/fieldGeometry'
import { getFoodCoord } from '../engine/food/food'

const vertexShader = `
  varying vec2 fieldPosition;
  void main() {
    fieldPosition = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const fragmentShader = `
  uniform vec2 applePosition;
  uniform vec2 surfaceHalfSize;
  uniform vec2 surfaceScale;
  uniform float cornerCut;
  varying vec2 fieldPosition;
  void main() {
    vec2 inset = surfaceHalfSize - abs(fieldPosition);
    if (min(inset.x, inset.y) < 0.0 || dot(inset / surfaceScale, vec2(1.0)) < cornerCut) discard;
    vec2 offset = fieldPosition - applePosition;
    float radius = length(offset);
    if (radius < 2.5) discard;
    float ringRadius = floor(radius / 5.0 + .5) * 5.0;
    float distanceToRing = abs(radius - ringRadius);
    if (distanceToRing > .05) discard;
    float angle = atan(offset.y, offset.x) + 3.14159265359;
    float dashCount = floor(6.28318530718 * ringRadius / .34 + .5);
    float dash = fract(angle / 6.28318530718 * dashCount);
    if (dash > .65) discard;
    float d = distanceToRing / .1;
    float glow = exp(-pow(d / .24, 2.0));
    float core = 1.0 - smoothstep(.055, .09, d);
    gl_FragColor = vec4(mix(vec3(.14, .44, 1.0), vec3(.4, .7, 1.0), core), max(core, glow * .45));
    #include <colorspace_fragment>
  }
`

// Distances are in field-local cell units; one mesh draws all five-cell rings.
export default function AppleDistanceRings() {
  const uniforms = useMemo(() => {
    const { width, depth, scaleX, scaleY, cornerCut } = arena.surface
    return {
      applePosition: { value: new Vector2(...toFieldScene(getFoodCoord() || [1, 1])) },
      surfaceHalfSize: { value: new Vector2(width * scaleX / (2 * arena.cellSize), depth * scaleY / (2 * arena.cellSize)) },
      surfaceScale: { value: new Vector2(scaleX, scaleY) },
      cornerCut: { value: cornerCut / arena.cellSize },
    }
  }, [])
  useFrame(() => {
    const food = getFoodCoord()
    if (food) uniforms.applePosition.value.set(...toFieldScene(food))
  })
  return <mesh position={[0, 0, .018]}>
    <planeGeometry args={[arena.columns, arena.rows]} />
    <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}
      blending={AdditiveBlending} transparent depthWrite={false} toneMapped={false} />
  </mesh>
}
