import { useEffect, useMemo } from 'react'
import { AdditiveBlending, BufferGeometry, DoubleSide, Float32BufferAttribute } from 'three'
import { getPlayableCells, toFieldScene } from '../../engine/field/fieldGeometry'

const vertexShader = `
  varying vec2 dashUv;
  void main() {
    dashUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const fragmentShader = `
  varying vec2 dashUv;
  void main() {
    float d = abs(dashUv.y - .5);
    float glow = exp(-pow(d / .24, 2.0));
    float core = 1.0 - smoothstep(.055, .09, d);
    gl_FragColor = vec4(mix(vec3(.14, .44, 1.0), vec3(.4, .7, 1.0), core), max(core, glow * .45));
    #include <colorspace_fragment>
  }
`

// One batched mesh for all tracks; clipped to complete playable cells.
export default function ObstacleTracks({ rows, columns }: { rows: number[]; columns: number[] }) {
  const key = `${[...new Set(rows)].sort().join(',')}/${[...new Set(columns)].sort().join(',')}`
  const geometry = useMemo(() => {
    const positions: number[] = [], uvs: number[] = []
    const rowSet = new Set(rows), columnSet = new Set(columns)
    for (const cell of getPlayableCells()) {
      const [x, y] = toFieldScene(cell)
      for (const horizontal of [true, false]) {
        if (!(horizontal ? rowSet.has(cell[1]) : columnSet.has(cell[0]))) continue
        for (const offset of [-.34, 0, .34]) {
          const points = [[-.11, -.05], [.11, -.05], [.11, .05], [-.11, .05]]
          for (const i of [0, 1, 2, 0, 2, 3]) {
            const [along, across] = points[i]
            positions.push(x + (horizontal ? along + offset : across), y + (horizontal ? across : along + offset), .018)
            uvs.push(along / .22 + .5, across / .1 + .5)
          }
        }
      }
    }
    const result = new BufferGeometry()
    result.setAttribute('position', new Float32BufferAttribute(positions, 3))
    result.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
    return result
    // Coordinates along a track change every tick; only its row/column matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  useEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry}>
    <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} transparent
      blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
  </mesh>
}
