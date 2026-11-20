import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { getAllObstacles } from '../engine/obstacles/getAllObstacles'
import { useFrame } from '@react-three/fiber'
import MovingObstacleSymbol from '../assets/obstacleSymbols/MovingObstacleSymbol'
import FixedObstacleSymbol from '../assets/obstacleSymbols/FixedObstacleSymbol'
import ObstacleCellFrame from '../assets/obstacleSymbols/ObstacleCellFrame'
import ObstacleTracks from '../assets/obstacleSymbols/ObstacleTracks'
import { getMovingHighlightedCells, resetHighlightedObstacleCells, setMovingObstacleVisualPositions } from '../engine/obstacles/highlightedObstacleCells'
import { getField, getFieldRows } from '../engine/field/fieldPerLevel'
import { SystemConfig } from '../config/systemConfig'
import { checkTimerWorking } from '../engine/time/isTimer'
import moveObstacles from '../engine/obstacles/moveObstacles'
import { checkMistake } from '../engine/lives/isMistake'
import { getCurrentLevel } from '../engine/levels/currentLevel'
import { updateAppleTimeIdealRoute } from '../engine/protocol/appleTimeEfficiency'

let threeCoordX: THREE.Vector3[] = []
let threeCoordY: THREE.Vector3[] = []
let counter = -1
let prevVisualX: number[] = []
let prevVisualY: number[] = []
let nextEngineX: number[] = []
let nextEngineY: number[] = []

function resetObstacleRenderState(): void {
  threeCoordX = []
  threeCoordY = []
  counter = -1
  prevVisualX = []
  prevVisualY = []
  nextEngineX = []
  nextEngineY = []
}

const Obstacles: React.FC = () => {
  const [renderLevel, setRenderLevel] = useState(getCurrentLevel())
  const renderLevelRef = useRef(renderLevel)
  const gridSize = getField()
  const { xCoord, xStep, yCoord, yStep, fixCoord } = getAllObstacles()

  // локальные состояния шагов для передачи в Hedgehog — будут обновляться в useFrame
  const [xStepState, setXStepState] = useState<number[]>(xStep)
  const [yStepState, setYStepState] = useState<number[]>(yStep)

  const obstaclesRefs = useRef<Record<string, React.RefObject<THREE.Group>>>({})
  const frameRefs = useRef<Record<string, React.RefObject<THREE.Group>>>({})
  const lastXStep = useRef<number[]>([...xStep])
  const lastYStep = useRef<number[]>([...yStep])

  useEffect(() => {
    resetObstacleRenderState()
    return () => resetHighlightedObstacleCells()
  }, [])

  useEffect(() => {
    renderLevelRef.current = renderLevel
    lastXStep.current = [...xStep]
    lastYStep.current = [...yStep]
    setXStepState([...xStep])
    setYStepState([...yStep])
  }, [renderLevel])
  // Создаём стабильные рефы по индексам координат для каждого типа препятствий.
  // Ключи x_0..x_n, y_0..y_n, fix_0..fix_n совпадают с индексами данных.
  const xCount = xCoord.length
  for (let i = 0; i < xCount; i++) {
    const key = `x_${i}`
    if (!obstaclesRefs.current[key])
      obstaclesRefs.current[key] = React.createRef<THREE.Group>()
    if (!frameRefs.current[key]) frameRefs.current[key] = React.createRef<THREE.Group>()
  }

  const yCount = yCoord.length
  for (let i = 0; i < yCount; i++) {
    const key = `y_${i}`
    if (!obstaclesRefs.current[key])
      obstaclesRefs.current[key] = React.createRef<THREE.Group>()
    if (!frameRefs.current[key]) frameRefs.current[key] = React.createRef<THREE.Group>()
  }

  const fixCount = fixCoord.length
  for (let i = 0; i < fixCount; i++) {
    const key = `fix_${i}`
    if (!obstaclesRefs.current[key])
      obstaclesRefs.current[key] = React.createRef<THREE.Group>()
  }

  useFrame(() => {
    const currentLevel = getCurrentLevel()
    if (renderLevelRef.current !== currentLevel) {
      resetObstacleRenderState()
      obstaclesRefs.current = {}
      frameRefs.current = {}
      resetHighlightedObstacleCells()
      renderLevelRef.current = currentLevel
      setRenderLevel(currentLevel)
      return
    }

    const shouldAnimateObstacles = checkTimerWorking() || checkMistake()
    const forceMoveByMistake = !checkTimerWorking() && checkMistake()
    const live=getAllObstacles()
    if(counter!==-1 && (threeCoordX.length!==live.xCoord.length || threeCoordY.length!==live.yCoord.length)){
      resetObstacleRenderState()
      resetHighlightedObstacleCells()
      for(const key of Object.keys(obstaclesRefs.current)){
        const [axis,index]=key.split('_')
        const count=axis==='x'?live.xCoord.length:axis==='y'?live.yCoord.length:live.fixCoord.length
        if(+index>=count){delete obstaclesRefs.current[key];delete frameRefs.current[key]}
      }
      setXStepState([...live.xStep]);setYStepState([...live.yStep])
      return
    }
    // 1. Тик: запускаем движок на границе периода (до инициализации, чтобы в первом кадре не срабатывало)
    if (counter === 0 && shouldAnimateObstacles) {
      // Сохраняем текущие экранные позиции как начало интерполяции
      threeCoordX.forEach((v, i) => {
        prevVisualX[i] = v.x
      })
      threeCoordY.forEach((v, i) => {
        prevVisualY[i] = v.y
      })
      // Шаг движка
      moveObstacles('x', forceMoveByMistake)
      moveObstacles('y', forceMoveByMistake)
      updateAppleTimeIdealRoute(false)
      // Читаем новые целевые позиции движка
      const updated = getAllObstacles()
      nextEngineX = updated.xCoord.map((c) => Math.round(c[0] - gridSize / 2) - 1)
      nextEngineY = updated.yCoord.map((c) => Math.round(c[1] - getFieldRows() / 2) - 1)
      // Обновляем направление ежей, сохраняя последнее ненулевое
      const newXSteps = updated.xStep.map((s, i) => {
        if (s !== 0) {
          lastXStep.current[i] = s
          return s
        }
        return lastXStep.current[i] ?? s
      })
      const newYSteps = updated.yStep.map((s, i) => {
        if (s !== 0) {
          lastYStep.current[i] = s
          return s
        }
        return lastYStep.current[i] ?? s
      })
      setXStepState(newXSteps)
      setYStepState(newYSteps)
    }

    // 2. Инициализация на первом кадре
    if (counter === -1) {
      threeCoordX = xCoord.map(
        (coord) =>
          new THREE.Vector3(
            Math.round(coord[0] - gridSize / 2) - 1,
            Math.round(coord[1] - getFieldRows() / 2) - 1,
            0,
          ),
      )
      threeCoordY = yCoord.map(
        (coord) =>
          new THREE.Vector3(
            Math.round(coord[0] - gridSize / 2) - 1,
            Math.round(coord[1] - getFieldRows() / 2) - 1,
            0,
          ),
      )
      prevVisualX = threeCoordX.map((v) => v.x)
      prevVisualY = threeCoordY.map((v) => v.y)
      nextEngineX = [...prevVisualX]
      nextEngineY = [...prevVisualY]
      counter = 0
    }

    // 3. Продвигаем счётчик
    if (shouldAnimateObstacles) counter += 1 / SystemConfig.FPS
    const tickProgress = counter // захватываем до сброса
    if (shouldAnimateObstacles && counter >= 1) counter = 0

    // 4. Плавная интерполяция prevVisual → nextEngine
    {
      const t = Math.min(tickProgress, 1)
      threeCoordX.forEach((vec, i) => {
        if (prevVisualX[i] !== undefined && nextEngineX[i] !== undefined)
          vec.x = prevVisualX[i] + (nextEngineX[i] - prevVisualX[i]) * t
      })
      threeCoordY.forEach((vec, i) => {
        if (prevVisualY[i] !== undefined && nextEngineY[i] !== undefined)
          vec.y = prevVisualY[i] + (nextEngineY[i] - prevVisualY[i]) * t
      })
    }

    const centreX=(gridSize+1)/2, centreY=(getFieldRows()+1)/2
    setMovingObstacleVisualPositions('x',threeCoordX.map(vec=>[vec.x+centreX,vec.y+centreY]))
    setMovingObstacleVisualPositions('y',threeCoordY.map(vec=>[vec.x+centreX,vec.y+centreY]))
    const activeX=getMovingHighlightedCells('x'), activeY=getMovingHighlightedCells('y')
    // 5. Передаём позиции в рефы
    Object.entries(obstaclesRefs.current).forEach(([key, ref]) => {
      const [obsType, indexStr] = key.split('_')
      const index = parseInt(indexStr, 10)
      if (obsType === 'fix') return
      const vec = obsType === 'x' ? threeCoordX[index] : threeCoordY[index]
      if (!vec) return
      ref.current?.position.set(vec.x, vec.y, 0)
      const cell=(obsType==='x'?activeX:activeY)[index]
      if(cell)frameRefs.current[key]?.current?.position.set(cell[0]-centreX,cell[1]-centreY,0)
    })
  }, -110)

  return (
    <>
      <ObstacleTracks rows={xCoord.map(coord => coord[1])} columns={yCoord.map(coord => coord[0])} />
      {Object.entries(obstaclesRefs.current || {}).map(([key, ref]) => {
        const [obsType, indexStr] = key.split('_')
        const index = parseInt(indexStr, 10)
        const directionArray = obsType === 'x' ? xStepState : yStepState

        // Грибы — неподвижные препятствия (fix)
        if (obsType === 'fix') {
          const fixCoords = fixCoord[index]
          if (!fixCoords) return null
          const fx = Math.round(fixCoords[0] - gridSize / 2) - 1
          const fy = Math.round(fixCoords[1] - getFieldRows() / 2) - 1

          return (
            <group key={key} position={[fx, fy, 0]}>
              <FixedObstacleSymbol />
            </group>
          )
        }

        // Ежи — движущиеся препятствия (x, y)
        return (
          <group key={key}>
            <group ref={frameRefs.current[key]}>
              <ObstacleCellFrame color='#2470ff' />
            </group>
            <group ref={ref}>
              <MovingObstacleSymbol axis={obsType === 'x' ? 'x' : 'y'} direction={directionArray[index] ?? 1} />
            </group>
          </group>
        )
      })}
    </>
  )
}
export default Obstacles
