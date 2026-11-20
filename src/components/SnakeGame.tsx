'use client'

import { useEffect, useState } from 'react'
import Main from './Main'
import ErrorScreen from './ErrorScreen'
import setInitialLevelOfGame from '../engine/events/setInitialLevelOfGame'
import { disableScrolling } from '../commands/disableScrolling'
import { enableScrolling } from '../commands/enableScrolling'
import { setTrainingMode, setTrainingSpeed } from '../engine/training/trainingMode'
import { useMenuStore } from '../store/menuStore'

type GameStatus = 'loading' | 'ready' | 'error'

function parseNumber(search: URLSearchParams, key: string, fallback: number): number {
  const value = Number.parseInt(search.get(key) ?? '', 10)
  return Number.isFinite(value) ? value : fallback
}

export default function SnakeGame({ autoStart = false }: { autoStart?: boolean }) {
  const [status, setStatus] = useState<GameStatus>('loading')

  useEffect(() => {
    try {
      const search = new URLSearchParams(window.location.search)
      const trainingSpeed = parseNumber(search, 'speed', 5)
      const level = Math.max(1, parseNumber(search, 'level', 1))

      setTrainingMode(search.get('mode') === 'training')
      setTrainingSpeed(trainingSpeed)

      if (!setInitialLevelOfGame(level)) {
        setStatus('error')
        return
      }

      setTrainingSpeed(trainingSpeed)
      disableScrolling()
      if ((autoStart || search.has('play')) && useMenuStore.getState().isVisible) {
        useMenuStore.getState().toggleModal()
      }
      setStatus('ready')
    } catch (error) {
      console.error('Error initializing app:', error)
      enableScrolling()
      setStatus('error')
    }

    return () => enableScrolling()
  }, [autoStart])

  if (status === 'loading') return <div className='app-loading'>Инициализация игры...</div>
  if (status === 'error') return <ErrorScreen message='Не удалось инициализировать игру' />

  return <Main />
}
