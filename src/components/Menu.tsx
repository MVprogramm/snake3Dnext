import React, { memo, useEffect, useState } from 'react'
import { useMenuStore, usePauseStore } from '../store/menuStore'
import { swapPause } from '../engine/events/pauseEvent'
import { setTrainingMode, setTrainingSpeed } from '../engine/training/trainingMode'
import AuthPanel from './AuthPanel'
import type { AuthMode } from './AuthPanel'
import SessionHistoryPanel from './SessionHistoryPanel'
import { getSupabaseClient } from '../services/supabaseClient'

const Menu: React.FC = () => {
  const { toggleModal, titleMenu } = useMenuStore()
  const { togglePause } = usePauseStore()
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    let isMounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) setUserEmail(data.user?.email ?? '')
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? '')
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  function startClassic() {
    const url = new URL(window.location.href)

    url.searchParams.delete('mode')
    url.searchParams.delete('speed')
    window.history.replaceState(null, '', url)

    setTrainingMode(false)
    toggleModal()
  }

  function startTraining() {
    const url = new URL(window.location.href)

    url.searchParams.set('mode', 'training')
    url.searchParams.set('speed', '5')
    window.history.replaceState(null, '', url)

    setTrainingMode(true)
    setTrainingSpeed(5)
    toggleModal()
  }

  function openAuth(mode: AuthMode) {
    setAuthMode(mode)
    window.requestAnimationFrame(() => {
      document.getElementById('account')?.scrollIntoView({ behavior: 'smooth' })
    })
  }

  if (titleMenu === 'start') {
    return (
      <div className='menu-game menu-start-screen'>
        <div className='landing-shell'>
          <header className='landing-header'>
            <a className='landing-logo' href='#top' aria-label='Snake 3D — наверх'>
              <span className='landing-logo-mark'>S3</span>
              <span>Snake 3D</span>
            </a>
            <nav className='landing-nav' aria-label='Разделы сайта'>
              <a href='#tournament'>Турнир</a>
              <a href='#school'>Школа</a>
              <a href='#series'>Сериал</a>
              <a href='#shop'>Магазин</a>
            </nav>
            {userEmail ? (
              <button
                className='button button-ghost landing-login landing-account'
                type='button'
                title={userEmail}
                onClick={() => document.getElementById('account')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <i className='fa-solid fa-user' aria-hidden='true'></i>
                <span>{userEmail}</span>
              </button>
            ) : (
              <button className='button button-ghost landing-login' type='button' onClick={() => openAuth('sign-in')}>Войти</button>
            )}
          </header>

          <main id='top'>
            <section className='landing-hero'>
              <div className='hero-copy'>
                <p className='eyebrow'><span>Новый вид спорта</span> · сезон 01</p>
                <h1>Вырасти<br /><em>чемпиона.</em></h1>
                <p className='hero-motto'>
                  Тренируй свою змейку, соревнуйся с другими змейками на одной арене: чья
                  змейка лучше собирает яблоки, использует бонусы, избегает столкновений и
                  контролирует пространство.
                </p>
                <div className='hero-actions'>
                  <button className='button button-primary' type='button' onClick={startClassic}>
                    <i className='fa-solid fa-play' aria-hidden='true'></i> Начать игру
                  </button>
                  <button className='button button-secondary' type='button' onClick={startTraining}>Открыть тренировку</button>
                </div>
              </div>
              <div className='hero-arena' aria-label='Схема турнирной арены'>
                <div className='arena-scoreboard'><span>LIVE</span><strong>04:27</strong><span>ROUND 03</span></div>
                <div className='arena-grid'>
                  <span className='snake-segment snake-head'></span><span className='snake-segment snake-two'></span>
                  <span className='snake-segment snake-three'></span><span className='snake-segment snake-four'></span>
                  <span className='arena-apple'><i className='fa-solid fa-apple-whole'></i></span>
                </div>
                <div className='arena-stats'>
                  <div><span>Точность</span><strong>94%</strong></div><div><span>Серия</span><strong>12</strong></div><div><span>Рейтинг</span><strong>#08</strong></div>
                </div>
              </div>
            </section>

            <section className='landing-section tournament-section' id='tournament'>
              <div className='section-heading'><p className='eyebrow'>01 · Турнирная арена</p><h2>Твой характер.<br />Её решения.</h2></div>
              <div className='section-body'>
                <p className='section-lead'>На одном поле встречаются змейки разных хозяев. Игроки не управляют ими во время матча — каждый чемпион действует автоматически, опираясь на навыки, которые получил на тренировках.</p>
                <div className='sport-metrics'>
                  <article><strong>AI</strong><span>автономная тактика</span></article><article><strong>1×1</strong><span>единая арена</span></article><article><strong>24/7</strong><span>сезонный рейтинг</span></article>
                </div>
                <div className='feature-strip'>
                  <span><i className='fa-solid fa-crosshairs'></i> Контроль поля</span><span><i className='fa-solid fa-bolt'></i> Реакция</span><span><i className='fa-solid fa-shield-halved'></i> Выживание</span><span><i className='fa-solid fa-trophy'></i> Результат</span>
                </div>
              </div>
            </section>

            <section className='landing-section school-section' id='school'>
              <div className='section-heading'><p className='eyebrow'>02 · Персональная школа</p><h2>Ты — тренер.<br />Змейка — атлет.</h2></div>
              <div className='section-body'>
                <p className='section-lead'>Создавай собственную программу подготовки: отрабатывай маршрут к яблоку, скорость реакции, работу с бонусами и безопасное движение в плотной борьбе.</p>
                <ol className='training-plan'>
                  <li><span>01</span><div><strong>Диагностика</strong><p>Узнай сильные стороны и зоны роста своей змейки.</p></div></li>
                  <li><span>02</span><div><strong>Тренировочный цикл</strong><p>Выбирай темп и закрепляй нужные игровые навыки.</p></div></li>
                  <li><span>03</span><div><strong>Выход на арену</strong><p>Проверяй подготовку в автономном турнирном матче.</p></div></li>
                </ol>
                <button className='button button-dark' type='button' onClick={startTraining}>Начать тренировку</button>
              </div>
            </section>

            <section className='landing-section series-section' id='series'>
              <div className='series-card'>
                <div className='series-number'>S01<span>/ 08</span></div>
                <div><p className='eyebrow'>03 · Интерактивный сериал</p><h2>Смотри историю.<br />Меняй её ход.</h2>
                  <p className='section-lead'>Каждая серия — новый этап пути змейки к большой арене. Твои решения, тренировки и результаты открывают развилки сюжета и влияют на следующую главу.</p>
                  <div className='episode-row'><span className='episode-active'>01<br /><small>Старт</small></span><span>02<br /><small>Отбор</small></span><span>03<br /><small>Дерби</small></span><span>04<br /><small>Финал</small></span></div>
                </div>
              </div>
            </section>

            <section className='landing-section shop-section' id='shop'>
              <div className='section-heading'><p className='eyebrow'>04 · Магазин клуба</p><h2>Очки работают<br />на команду.</h2></div>
              <div className='section-body'>
                <p className='section-lead'>Обменивай заработанные очки на то, что делает твою змейку уникальной и помогает ей развиваться.</p>
                <div className='shop-grid'>
                  <article><i className='fa-solid fa-palette'></i><strong>Дизайн</strong><span>Цвета, фактуры и образ чемпиона</span></article>
                  <article><i className='fa-solid fa-dumbbell'></i><strong>Тренировки</strong><span>Новые упражнения для школы</span></article>
                  <article><i className='fa-solid fa-film'></i><strong>Серии</strong><span>Следующие главы интерактивной истории</span></article>
                </div>
              </div>
            </section>

            <section className='account-section' id='account'>
              <div className='account-intro'><p className='eyebrow'>Твой клуб начинается здесь</p><h2>Сохраняй прогресс.<br />Строй карьеру.</h2><p>Войди в аккаунт, чтобы видеть историю тренировок и результаты своей змейки.</p></div>
              <div className='account-panels'><AuthPanel embedded mode={authMode} onModeChange={setAuthMode} /><SessionHistoryPanel /></div>
            </section>
          </main>

          <footer className='landing-footer'>
            <span className='landing-logo'><span className='landing-logo-mark'>S3</span><span>Snake 3D</span></span>
            <p>Тренируй умнее. Соревнуйся сильнее.</p>
            <button type='button' onClick={() => openAuth('sign-up')}>Создать команду <i className='fa-solid fa-arrow-right'></i></button>
          </footer>
        </div>
      </div>
    )
  }

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
