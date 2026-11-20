import { useEffect, useRef, useState } from 'react'
import { Scene } from './Scene'
import renderInfo from '../engine/render/renderInfo'
import { useFrame } from '@react-three/fiber'
import setLoop from '../engine/time/setLoop'
import { useMenuStore } from '../store/menuStore'
import keyboardEvents from '../engine/events/keyboardEvents'
import { keyboardPauseEvent } from '../engine/events/pauseEvent'
import { getInterruptGame } from '../engine/events/interruptGameEvent'
import { getCurrentLevel } from '../engine/levels/currentLevel'

const SCENE_FINISH_DELAY_MS = 500

export const Game = () => {
  const isVisible = useMenuStore((state) => state.isVisible)
  const titleMenu = useMenuStore((state) => state.titleMenu)
  const [showScene, setShowScene] = useState(true)
  const [sceneLevel, setSceneLevel] = useState(getCurrentLevel)
  const sceneLevelRef = useRef(sceneLevel)
  const finishTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    document.removeEventListener('keydown', keyboardEvents)
    document.removeEventListener('keydown', keyboardPauseEvent)

    if (isVisible && titleMenu === 'Pause') {
      document.addEventListener('keydown', keyboardPauseEvent)
    } else if (!isVisible) {
      document.addEventListener('keydown', keyboardEvents)
    }

    return () => {
      document.removeEventListener('keydown', keyboardEvents)
      document.removeEventListener('keydown', keyboardPauseEvent)
    }
  }, [isVisible, titleMenu])

  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current !== null) {
        window.clearTimeout(finishTimeoutRef.current)
      }
    }
  }, [])

  useFrame((_, delta) => {
    setLoop(delta)
    renderInfo()

    const currentLevel = getCurrentLevel()
    const changedLevel = sceneLevelRef.current !== currentLevel
    if (changedLevel) {
      sceneLevelRef.current = currentLevel
      setSceneLevel(currentLevel)
    }

    if (changedLevel || !getInterruptGame()) {
      // A previous level's delayed finish must never hide the new scene.
      if (finishTimeoutRef.current !== null) {
        window.clearTimeout(finishTimeoutRef.current)
        finishTimeoutRef.current = null
      }
      if (!showScene) setShowScene(true)
    } else if (showScene && finishTimeoutRef.current === null) {
      const finishedLevel = currentLevel
      finishTimeoutRef.current = window.setTimeout(() => {
        finishTimeoutRef.current = null
        if (getCurrentLevel() === finishedLevel && getInterruptGame()) {
          setShowScene(false)
        }
      }, SCENE_FINISH_DELAY_MS)
    }
  }, -100)

  return showScene && <Scene key={sceneLevel} />
}
