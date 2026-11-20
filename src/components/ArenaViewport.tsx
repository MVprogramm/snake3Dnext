import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, Group, SRGBColorSpace } from 'three'
import { createTrainingArena } from '../assets/trainingArena/createTrainingArena'
import { Game } from './Game'
import '../styles/trainingArena.css'

function ArenaScene({ mount, handle }: { mount: HTMLDivElement; handle: HTMLButtonElement }) {
  const { gl, camera } = useThree()
  const arena = useRef<ReturnType<typeof createTrainingArena> | null>(null)
  const [gameplay, setGameplay] = useState<Group | null>(null)
  useEffect(() => {
    const instance = createTrainingArena(gl, camera, mount, handle)
    arena.current = instance
    setGameplay(instance.gameplay)
    return () => {
      arena.current = null
      // React owns gameplay resources; dispose only the imported arena.
      instance.gameplay.removeFromParent()
      instance.dispose()
    }
  }, [gl, camera, mount, handle])
  useFrame((_, delta) => arena.current?.render(delta), 1)
  return gameplay && createPortal(<Suspense fallback={null}><Game /></Suspense>, gameplay)
}

export default function ArenaViewport() {
  const [mount, setMount] = useState<HTMLDivElement | null>(null)
  const [handle, setHandle] = useState<HTMLButtonElement | null>(null)
  return <>
    <div ref={setMount} className='training-arena'>
      {mount && handle && <Canvas className='arena-canvas' dpr={[1, 2]} shadows
        gl={{ antialias: true, alpha: true, toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace }}
        camera={{ fov: 38, near: .1, far: 240, zoom: .45 }}>
        <ArenaScene mount={mount} handle={handle} />
      </Canvas>}
    </div>
    <button ref={setHandle} className='arena-pan-handle' type='button'
      aria-label='Голубые стрелки — перемещение; белые — масштаб'
      title='Голубые стрелки — перемещение; белые — масштаб'
      onTouchStart={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>
      <svg data-control-icon='arrows' viewBox='0 0 32 32' aria-hidden='true'>
        {['pan', 'scale'].map(kind => <g key={kind} fill='none' stroke={kind === 'pan' ? 'currentColor' : '#f4ffff'} strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
          {Object.entries({ up: 'M16 13V3m-5 5 5-5 5 5', down: 'M16 19v10m-5-5 5 5 5-5', left: 'M13 16H3m5-5-5 5 5 5', right: 'M19 16h10m-5-5 5 5-5 5' }).map(([direction, d]) =>
            <path key={direction} {...{ [`data-${kind}-direction`]: direction }} d={d} />)}
        </g>)}
        <circle cx='16' cy='16' r='3' fill='#dffcff' />
      </svg>
      <svg data-control-icon='magnifier' viewBox='0 0 32 32' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' aria-hidden='true'>
        <circle cx='13' cy='13' r='9' /><path d='m20 20 9 9M9 13h8m-4-4v8' />
      </svg>
      <svg data-control-icon='close' viewBox='0 0 32 32' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' aria-hidden='true'>
        <path d='m7 7 18 18M25 7 7 25' />
      </svg>
    </button>
  </>
}
