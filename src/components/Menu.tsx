import React, { memo } from 'react'
import LandingPage from './LandingPage'
import { useMenuStore, usePauseStore } from '../store/menuStore'
import { swapPause } from '../engine/events/pauseEvent'
import { setTrainingMode } from '../engine/training/trainingMode'

const Menu: React.FC = () => {
  const { toggleModal, titleMenu } = useMenuStore()
  const { togglePause } = usePauseStore()
  function startClassic() {
    const url = new URL(window.location.href)

    url.searchParams.delete('mode')
    url.searchParams.delete('speed')
    window.history.replaceState(null, '', url)

    setTrainingMode(false)
    toggleModal()
  }

  if (titleMenu === 'start') return <LandingPage onStart={startClassic} />

  return (
    <div
      className='menu-game'
      onClick={() => {
        if (titleMenu.indexOf('Game over') !== -1) location.reload()
        else if (titleMenu === 'Pause') {
          togglePause()
          swapPause()
          toggleModal()
        } else toggleModal()
      }}
    >
      <h2>{titleMenu}</h2>
    </div>
  )
}

export default memo(Menu)
