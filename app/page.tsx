"use client"

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import LandingPage from '../src/components/LandingPage'

const SnakeGame = dynamic(() => import('../src/components/SnakeGame'), {
  ssr: false,
  loading: () => <div className='app-loading'>???????? ????...</div>,
})

export default function HomePage() {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    // Cabinet/training links already authorize direct game startup.
    if (new URLSearchParams(window.location.search).has('play')) setStarted(true)
  }, [])

  function startClassic() {
    const url = new URL(window.location.href)
    url.searchParams.delete('mode')
    url.searchParams.delete('speed')
    window.history.replaceState(null, '', url)
    setStarted(true)
  }

  return started ? <SnakeGame autoStart /> : <LandingPage onStart={startClassic} />
}
