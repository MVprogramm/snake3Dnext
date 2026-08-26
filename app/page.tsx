'use client'

import dynamic from 'next/dynamic'

const SnakeGame = dynamic(() => import('../src/components/SnakeGame'), {
  ssr: false,
  loading: () => <div className='app-loading'>Загрузка игры...</div>,
})

export default function HomePage() {
  return <SnakeGame />
}
