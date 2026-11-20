import { createRef, RefObject, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import SportSnakePart from '../assets/sportSnake/SportSnakePart'
import React from 'react'
import { snakeAnimation } from '../animations/snakeAnimation/snakeAnimation'
import { getSnakeBodyCoord } from '../engine/snake/snake'
import { getAmountOfFood } from '../engine/food/amountOfFoodPerLevel'
import * as U from '../animations/snakeAnimation/bodyAnimations/snakeBodyProps'
import { SmoothSnakeTrail } from '../animations/snakeAnimation/smoothSnakeTrail'
import { getCurrentLevel } from '../engine/levels/currentLevel'
import { checkHighlightedHeadContact } from '../engine/events/highlightedHeadContact'

/**
 * Компонент Snake рендерит 3D-модель змеи, состоящую из головы, тела и хвоста.
 */
const Snake = () => {
  const snakeMaxLength = getAmountOfFood() + 1
  const [snakeCurrentLength, setSnakeCurrentLength] = useState(3)
  const snake = Array(snakeMaxLength).fill(1)
  const [snakeSeparate, setSnakeSeparate] = useState(Array(snakeMaxLength).fill(1))
  const trail = useRef(new SmoothSnakeTrail())
  const trailLevel = useRef(getCurrentLevel())
  const snakeRefs = useRef<{ [key: string]: RefObject<THREE.Group> }>({})

  const getVisibleSnakeUnits = (bodyLength: number, maxLength: number): number[] =>
    Array.from({ length: maxLength }, (_, index) => (index > bodyLength - 3 ? 0 : 1))

  const getSnakeRef = (key: string): RefObject<THREE.Group> => {
    if (!snakeRefs.current[key]) snakeRefs.current[key] = createRef<THREE.Group>()
    return snakeRefs.current[key]
  }

  const headRef = getSnakeRef('headRef')
  const tailRef = getSnakeRef('tailRef')

  useEffect(() => {
    const currentBodyLength = getSnakeBodyCoord().length
    setSnakeCurrentLength(currentBodyLength)
    setSnakeSeparate(getVisibleSnakeUnits(currentBodyLength, snakeMaxLength))
  }, [snakeMaxLength])

  useFrame((_, delta) => {
    snakeAnimation(delta)
    const obstacleContact = checkHighlightedHeadContact()
    const currentBodyLength = getSnakeBodyCoord().length
    const updatedSnake = getVisibleSnakeUnits(currentBodyLength, snakeMaxLength)

    setSnakeSeparate(updatedSnake)
    if (snakeCurrentLength !== currentBodyLength) {
      setSnakeCurrentLength(currentBodyLength)
    }
    const level = getCurrentLevel()
    const poses = trail.current.update(U.getSnakeUnitPosition(), currentBodyLength - 1, obstacleContact || level !== trailLevel.current)
    trailLevel.current = level
    for (const [key, ref] of Object.entries(snakeRefs.current)) {
      const index = key === 'headRef' ? 0 : key === 'tailRef' ? currentBodyLength - 2 : Number(key.replace('bodyUnitRef_', ''))
      const pose = poses[index]
      if (!ref.current || !pose) continue
      ref.current.position.set(pose.x, pose.y, pose.z)
      ref.current.rotation.set(pose.pitch, 0, pose.yaw, 'ZXY')
      if (index > 0) {
        const scale = .65 + .35 * (1 - index / currentBodyLength)
        ref.current.scale.setScalar(scale)
      }
    }
  }, -20)

  return (
    <group>
      {snakeSeparate.map((ref, index) => {
        if (index === 0) {
          return (
            <group key={index} ref={headRef}>
              <SportSnakePart part='head' />
            </group>
          )
        } else if (index < snakeMaxLength - 1) {
          return (
            ref === 1 && (
              <group key={index} ref={getSnakeRef(`bodyUnitRef_${index}`)}>
                <SportSnakePart part='body' />
              </group>
            )
          )
        } else if (index === snakeMaxLength - 1) {
          return (
            <group key={index} ref={tailRef}>
              <SportSnakePart part='tail' />
            </group>
          )
        } else {
          return null
        }
      })}
    </group>
  )
}

export default React.memo(Snake)
