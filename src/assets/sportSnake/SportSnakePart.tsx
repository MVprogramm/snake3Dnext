import { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group, MathUtils, Mesh } from 'three'
import { getSnakeJawProps } from '../../animations/snakeAnimation/headAnimations/foodEatenAnimation'

type Part = 'head' | 'body' | 'tail'
const PART_NODES: Record<Part, string> = { head: 'SportHead', body: 'SportBody', tail: 'SportTail' }
const MODEL_URL = '/sport-snake.glb'

export default function SportSnakePart({ part }: { part: Part }) {
  const { scene } = useGLTF(MODEL_URL)
  const pose = useRef<Group>(null)
  const model = useMemo(() => {
    const source = scene.getObjectByName(PART_NODES[part])
    if (!source) throw new Error(`Missing sport snake part: ${part}`)
    const clone = source.clone(true)
    clone.traverse(object => {
      if (object instanceof Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })
    return clone
  }, [scene, part])
  const jaw = useMemo(() => model.getObjectByName('JawPivot'), [model])
  const tongue = useMemo(() => model.getObjectByName('Tongue') as Mesh | undefined, [model])

  useFrame(({ clock }) => {
    if (part !== 'head') return
    // Keep existing gameplay/food timing, translating its pose into the new jaw hinge.
    const mouth = MathUtils.clamp((Number(getSnakeJawProps()['rotation-x']) + .05) / -1.25, 0, 1)
    if (jaw) jaw.rotation.x = -mouth * MathUtils.degToRad(65)
    if (tongue?.morphTargetDictionary && tongue.morphTargetInfluences) {
      const weights = tongue.morphTargetInfluences
      const targets = tongue.morphTargetDictionary
      const sway = Math.sin(clock.elapsedTime * 8) * mouth
      weights[targets.Extend] = mouth
      weights[targets.Sway_Left] = Math.max(0, sway)
      weights[targets.Sway_Right] = Math.max(0, -sway)
    }
  }, -15)

  // GLB is Y-up. Restore Blender's Z-up/+Y-forward axes used by the game.
  return <group ref={pose} scale={[part === 'head' ? 1.25 : 1.875, 1.25, 1.25]}><primitive object={model} rotation={[Math.PI / 2, 0, 0]} dispose={null} /></group>
}

useGLTF.preload(MODEL_URL)
