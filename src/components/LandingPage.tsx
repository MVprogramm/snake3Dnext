import React, { memo, useEffect, useState } from 'react'
import Image from 'next/image'
import SessionHistoryPanel from './SessionHistoryPanel'
import { getSupabaseClient } from '../services/supabaseClient'

function LandingPage({ onStart }: { onStart: () => void }) {
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    let isMounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return
      setUserEmail(data.user?.email ?? '')
      // Preserve the signed-in home redirect, but only after the landing has painted.
      if (data.user && !new URLSearchParams(window.location.search).has('play')) {
        window.location.replace('/cabinet')
      }
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? '')
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const startClassic = onStart

    return (
      <div className='menu-game menu-start-screen'>
        <div className='landing-shell'>
          <header className='landing-header'>
            <a className='landing-logo' href='#top' aria-label='Snake 3D — наверх'>
              <span className='landing-logo-mark'>S3</span>
              <span>Snake 3D</span>
            </a>
            <nav className='landing-nav' aria-label='Разделы сайта'>
              <a href='#how-it-works'>Путь игрока</a>
              <a href='#mastery'>Мастерство</a>
              <a href='#school'>Школа</a>
              <a href='#tournament'>Турнир</a>
            </nav>
            {userEmail ? (
              <button
                className='button button-ghost landing-login landing-account'
                type='button'
                title={userEmail}
                onClick={() => window.location.assign('/cabinet')}
              >
                <i className='fa-solid fa-user' aria-hidden='true'></i>
                <span>{userEmail}</span>
              </button>
            ) : (
              <a className='button button-ghost landing-login' href='/login'>Войти</a>
            )}
          </header>

          <main id='top'>
            <section className='landing-hero'>
              <div className='hero-copy'>
                <p className='eyebrow'><span>Путь к турниру</span> · начинается с тебя</p>
                <h1>Освой игру.<br /><em>Стань мастером.</em></h1>
                <p className='hero-gameplay'>Проходи тактические уровни, выбирай один из двух бонусов и формируй собственный стиль игры.</p>
                <p className='hero-motto'>
                  Сейчас можно пройти первые четыре уровня и попробовать режим тренировки.
                  Полная учебная программа, тест мастерства и турниры — следующие этапы развития игры.
                </p>
                <div className='hero-actions'>
                  <button className='button button-primary' type='button' onClick={startClassic}>
                    <i className='fa-solid fa-play' aria-hidden='true'></i> Начать обучение
                  </button>
                </div>
                <p className='hero-note'><i className='fa-solid fa-circle-check' aria-hidden='true'></i> Доступно сейчас: 4 игровых уровня и режим тренировки</p>
              </div>
                <div className='hero-lesson' aria-label='Первый учебный уровень'>
                  <div className='lesson-header'><span>ДОСТУПНО СЕЙЧАС</span><strong>УРОВЕНЬ 01</strong><span>ОБУЧЕНИЕ</span></div>
                  <div className='lesson-preview'>
                    <Image
                      className='arena-gameplay-image'
                      src='/arena-gameplay.png'
                      width={1536}
                      height={1024}
                      priority
                      alt='Синяя змейка на зелёном игровом поле с яблоком и препятствиями'
                    />
                </div>
                <div className='lesson-stats'>
                  <div><span>Задача</span><strong>Собери еду</strong></div><div><span>Подсказки</span><strong>Включены</strong></div><div><span>Навык</span><strong>Маршрут</strong></div>
                </div>
              </div>
            </section>

            <section className='journey-section' id='how-it-works'>
              <div className='journey-heading'>
                <p className='eyebrow'>Твоя траектория</p>
                <h2>Четыре этапа.<br />Одна цель.</h2>
              </div>
              <div className='journey-steps'>
                <article className='journey-current'><span>01 · Доступно</span><i className='fa-solid fa-gamepad' aria-hidden='true'></i><h3>Освой игру</h3><p>Первые четыре тактических уровня уже доступны. Программа будет расширена до девяти.</p></article>
                <article><span>02 · Планируется</span><i className='fa-solid fa-medal' aria-hidden='true'></i><h3>Стань мастером</h3><p>Тестовый уровень 10 без подсказок сформирует профиль навыков игрока.</p></article>
                <article><span>03 · Планируется</span><i className='fa-solid fa-graduation-cap' aria-hidden='true'></i><h3>Научи змейку</h3><p>Подготовленная система обучения передаст змейке стиль её хозяина.</p></article>
                <article><span>04 · Планируется</span><i className='fa-solid fa-trophy' aria-hidden='true'></i><h3>Выйди на турнир</h3><p>В будущем обученные змейки будут самостоятельно соревноваться на арене.</p></article>
              </div>
            </section>

            <section className='landing-section mastery-section' id='mastery'>
              <div className='section-heading'><p className='eyebrow'>Этапы 01–02 · Путь мастера <span className='availability availability-planned'>Планируется</span></p><h2>Девять уроков.<br />Один экзамен.</h2></div>
              <div className='section-body'>
                <p className='section-lead'>В полной программе уровни с первого по девятый будут последовательно обучать управлению, маршрутам, скорости, препятствиям и бонусам. Десятый уровень станет итоговым тестом без подсказок.</p>
                <div className='lesson-overview'>
                  <div className='lesson-overview-copy'>
                    <span>Урок 1 / 9</span>
                    <h3>Первые движения</h3>
                    <dl>
                      <div><dt>Навык</dt><dd>Управление</dd></div>
                      <div><dt>Цель</dt><dd>Собрать первые яблоки</dd></div>
                    </dl>
                  </div>
                  <div className='lesson-route' aria-label='Программа обучения из девяти уроков: четыре доступны, пять запланированы'>
                    {[1, 2, 3, 4].map((lesson) => <span className={lesson === 1 ? 'lesson-active' : 'lesson-available'} key={lesson}><strong>{lesson}</strong><small>{lesson === 1 ? 'Старт' : 'Доступен'}</small></span>)}
                    {[5, 6, 7, 8, 9].map((lesson) => <span className='lesson-future' key={lesson}><strong>{lesson}</strong><small>В плане</small></span>)}
                  </div>
                  <div className='mastery-test'><span>После 9 уроков</span><strong>Уровень 10 · Тест мастерства</strong><small>Без подсказок · планируется</small></div>
                </div>
                <p className='mastery-result'><i className='fa-solid fa-chart-simple' aria-hidden='true'></i><span><strong>Планируемый результат теста — профиль мастерства:</strong> эффективность маршрута, реакция, контроль скорости, осторожность и работа с бонусами.</span></p>
              </div>
            </section>

            <section className='landing-section school-section' id='school'>
              <div className='section-heading'><p className='eyebrow'>Этап 03 · Школа змейки <span className='availability availability-planned'>Планируется</span></p><h2>Теперь ты —<br />тренер.</h2></div>
              <div className='section-body'>
                <p className='section-lead'>После появления теста профиль мастерства станет отправной точкой обучения змейки. Игрок сможет передать ей свой подход и укреплять отдельные навыки упражнениями.</p>
                <ol className='training-plan'>
                  <li><span>01</span><div><strong>Передай свой стиль</strong><p>Змейка получает основу из твоих результатов на тестовом уровне.</p></div></li>
                  <li><span>02</span><div><strong>Выбери навык</strong><p>Работай над маршрутом, реакцией, осторожностью или бонусами.</p></div></li>
                  <li><span>03</span><div><strong>Проверь прогресс</strong><p>Сравни поведение змейки до и после тренировочного цикла.</p></div></li>
                </ol>
                <button className='button button-dark' type='button' onClick={startClassic}>Начать с первого урока</button>
              </div>
            </section>

            <section className='landing-section tournament-section' id='tournament'>
              <div className='section-heading'><p className='eyebrow'>Этап 04 · Турнирная арена <span className='availability availability-planned'>Планируется</span></p><h2>Твоя школа.<br />Её победа.</h2></div>
              <div className='section-body'>
                <p className='section-lead'>В будущей турнирной системе змейка будет действовать самостоятельно — выбирать маршрут, использовать бонусы и избегать столкновений. Сезонный рейтинг также относится к планируемому развитию.</p>
                <div className='sport-metrics'>
                  <article><strong>AI</strong><span>автономные решения · в плане</span></article><article><strong>1×1</strong><span>единое поле · в плане</span></article><article><strong>TOP</strong><span>сезонный рейтинг · в плане</span></article>
                </div>
                <div className='feature-strip'><span><i className='fa-solid fa-route'></i> Маршрут</span><span><i className='fa-solid fa-bolt'></i> Реакция</span><span><i className='fa-solid fa-shield-halved'></i> Осторожность</span><span><i className='fa-solid fa-trophy'></i> Результат</span></div>
              </div>
            </section>

            <section className='account-section' id='account'>
              <div className='account-intro'><p className='eyebrow'>Твой клуб начинается здесь</p><h2>Сохраняй прогресс.<br />Строй карьеру.</h2><p>Войди в аккаунт, чтобы видеть историю тренировок и результаты своей змейки.</p></div>
              <div className='account-panels'><div className='account-auth-links'>{userEmail ? <a className='button button-dark' href='/cabinet'>Личный кабинет</a> : <><a className='button button-dark' href='/login'>Войти</a><a className='button button-dark' href='/register'>Зарегистрироваться</a></>}</div><SessionHistoryPanel /></div>
            </section>
          </main>

          <footer className='landing-footer'>
            <span className='landing-logo'><span className='landing-logo-mark'>S3</span><span>Snake 3D</span></span>
            <p>Освой · Стань мастером · Научи · Побеждай</p>
            <a className='landing-register' href='/register'>Создать команду <i className='fa-solid fa-arrow-right'></i></a>
          </footer>
        </div>
      </div>
    )
}

export default memo(LandingPage)
