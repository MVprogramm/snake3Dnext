'use client'

import { useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '../services/supabaseClient'
import { signOut } from '../services/authRepository'
import {
  GameSessionSummary,
  listGameSessions,
} from '../services/gameSessionRepository'

const LEARNING_LEVELS = 9
const MASTERY_TEST_LEVEL = 10

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getEfficiencyLabel(value: number | null): string {
  if (value === null) return 'Нет данных'
  if (value < 1.5) return 'Уровень освоен'
  if (value <= 2.5) return 'Рабочая сложность'
  return 'Нужна практика'
}

function PersonalCabinet() {
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [sessions, setSessions] = useState<GameSessionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function handleSignOut() {
    const result = await signOut()
    if (result.ok) window.location.assign('/')
    else setError(result.error ?? 'Не удалось выйти из аккаунта')
  }

  useEffect(() => {
    const supabase = getSupabaseClient()

    if (!supabase) {
      setError('Сервис аккаунтов не настроен')
      setIsLoading(false)
      return
    }

    const client = supabase

    let isMounted = true

    async function loadCabinet() {
      const { data, error: userError } = await client.auth.getUser()
      if (!isMounted) return

      if (userError || !data.user) {
        setUser(null)
        setIsLoading(false)
        return
      }

      setUser(data.user)

      const [{ data: profile }, sessionResult] = await Promise.all([
        client.from('profiles').select('display_name').eq('id', data.user.id).maybeSingle(),
        listGameSessions(100),
      ])

      if (!isMounted) return
      setDisplayName(profile?.display_name ?? data.user.user_metadata.display_name ?? '')
      setSessions(sessionResult.sessions)
      setError(sessionResult.error ?? '')
      setIsLoading(false)
    }

    void loadCabinet()

    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) setUser(null)
    })

    return () => {
      isMounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const summary = useMemo(() => {
    const passedLevels = new Set(
      sessions
        .filter((session) => session.status === 'completed' || session.status === 'won')
        .map((session) => session.levelNumber),
    )
    const learningPassed = Array.from({ length: LEARNING_LEVELS }, (_, index) => index + 1)
      .filter((level) => passedLevels.has(level)).length
    const testPassed = passedLevels.has(MASTERY_TEST_LEVEL)
    const efficiencySessions = sessions.filter(
      (session) => session.appleTimeOverrunAvg !== null,
    )
    const averageEfficiency = efficiencySessions.length
      ? efficiencySessions.reduce(
          (sum, session) => sum + (session.appleTimeOverrunAvg ?? 0),
          0,
        ) / efficiencySessions.length
      : null
    const masteryLevel = sessions
      .filter(
        (session) =>
          session.appleTimeOverrunAvg !== null &&
          session.appleTimeOverrunAvg >= 1.5 &&
          session.appleTimeOverrunAvg <= 2.5,
      )
      .reduce((highest, session) => Math.max(highest, session.levelNumber), 0)

    return {
      passedLevels,
      learningPassed,
      testPassed,
      averageEfficiency,
      masteryLevel,
      totalScore: sessions.reduce((sum, session) => sum + session.score, 0),
      completionRate: sessions.length
        ? Math.round(
            (sessions.filter((session) => session.status !== 'game_over').length /
              sessions.length) *
              100,
          )
        : 0,
    }
  }, [sessions])

  if (isLoading) {
    return <main className='cabinet-state'>Загружаем личный кабинет…</main>
  }

  if (!user) {
    return (
      <main className='cabinet-state'>
        <span className='cabinet-state-icon'><i className='fa-solid fa-lock'></i></span>
        <h1>Личный кабинет доступен после входа</h1>
        <p>Войдите на главной странице, чтобы увидеть прогресс и результаты.</p>
        <a className='cabinet-primary-link' href='/login'>Перейти ко входу</a>
      </main>
    )
  }

  const progress = Math.round(
    ((summary.learningPassed + (summary.testPassed ? 1 : 0)) / MASTERY_TEST_LEVEL) *
      100,
  )

  return (
    <main className='cabinet-page'>
      <header className='cabinet-header'>
        <a className='cabinet-logo' href='/'><span>S3</span> Snake 3D</a>
        <nav aria-label='Навигация кабинета'>
          <a href='#progress'>Обучение</a>
          <a href='#skills'>Мастерство</a>
          <a href='#snake-school'>Школа змейки</a>
          <a href='#history'>История</a>
        </nav>
        <div className='cabinet-user'>
          <i className='fa-solid fa-user'></i>
          <span>{displayName || user.email}</span>
          <button type='button' onClick={handleSignOut} aria-label='Выйти из аккаунта' title='Выйти'>
            <i className='fa-solid fa-arrow-right-from-bracket'></i>
          </button>
        </div>
      </header>

      <div className='cabinet-content'>
        <section className='cabinet-welcome'>
          <div>
            <p className='cabinet-eyebrow'>Личный кабинет</p>
            <h1>{displayName ? `${displayName}, продолжим путь?` : 'Продолжим путь?'}</h1>
            <p>Здесь собраны твой прогресс, игровые показатели и готовность змейки к автономному турниру.</p>
          </div>
          <a className='cabinet-primary-link' href='/?play=1'>Продолжить обучение <i className='fa-solid fa-arrow-right'></i></a>
        </section>

        {error && <p className='cabinet-alert'>{error}</p>}

        <section className='cabinet-section' id='progress'>
          <div className='cabinet-section-heading'>
            <div><p className='cabinet-eyebrow'>Этап 01 · Освой игру</p><h2>Путь к мастерству</h2></div>
            <strong className='cabinet-progress-value'>{progress}%</strong>
          </div>
          <div className='cabinet-progress-bar'><span style={{ width: `${progress}%` }}></span></div>
          <div className='cabinet-levels'>
            {Array.from({ length: LEARNING_LEVELS }, (_, index) => index + 1).map((level) => (
              <article className={summary.passedLevels.has(level) ? 'cabinet-level level-complete' : 'cabinet-level'} key={level}>
                <span>{summary.passedLevels.has(level) ? <i className='fa-solid fa-check'></i> : level}</span>
                <div><strong>Уровень {level}</strong><small>{summary.passedLevels.has(level) ? 'Пройден' : 'Учебный'}</small></div>
              </article>
            ))}
            <article className={summary.testPassed ? 'cabinet-level level-test level-complete' : 'cabinet-level level-test'}>
              <span>{summary.testPassed ? <i className='fa-solid fa-check'></i> : '10'}</span>
              <div><strong>Тест мастера</strong><small>{summary.testPassed ? 'Пройден' : 'После 9 уроков'}</small></div>
            </article>
          </div>
        </section>

        <section className='cabinet-section' id='skills'>
          <div className='cabinet-section-heading'><div><p className='cabinet-eyebrow'>Этап 02 · Стань мастером</p><h2>Профиль навыков</h2></div><span className='cabinet-status'>{summary.testPassed ? 'Профиль подтверждён' : 'Формируется'}</span></div>
          <div className='cabinet-metrics'>
            <article><span>Освоено уровней</span><strong>{summary.learningPassed}<small>/9</small></strong></article>
            <article><span>Уровень мастерства</span><strong>{summary.masteryLevel || '—'}</strong></article>
            <article><span>Эффективность пути</span><strong>{summary.averageEfficiency === null ? '—' : `${summary.averageEfficiency.toFixed(2)}×`}</strong><small>{getEfficiencyLabel(summary.averageEfficiency)}</small></article>
            <article><span>Успешные сессии</span><strong>{summary.completionRate}%</strong></article>
            <article><span>Всего очков</span><strong>{summary.totalScore}</strong></article>
          </div>
          <div className='cabinet-skill-list'>
            <div><span>Маршрут</span><strong>{summary.averageEfficiency === null ? 'Нет данных' : getEfficiencyLabel(summary.averageEfficiency)}</strong></div>
            <div><span>Реакция</span><strong>Будет измерена на тесте</strong></div>
            <div><span>Контроль скорости</span><strong>Будет измерен на тесте</strong></div>
            <div><span>Осторожность</span><strong>Будет измерена на тесте</strong></div>
            <div><span>Работа с бонусами</span><strong>Будет измерена на тесте</strong></div>
          </div>
        </section>

        <div className='cabinet-two-columns'>
          <section className='cabinet-section cabinet-locked-section' id='snake-school'>
            <p className='cabinet-eyebrow'>Этап 03 · Научи змейку</p>
            <i className={`fa-solid ${summary.testPassed ? 'fa-graduation-cap' : 'fa-lock'} cabinet-feature-icon`}></i>
            <h2>Школа змейки</h2>
            <p>{summary.testPassed ? 'Профиль мастерства готов стать основой программы обучения змейки.' : 'Откроется после прохождения тестового уровня 10. Сначала змейке нужен подтверждённый профиль тренера.'}</p>
            <span className='cabinet-status'>{summary.testPassed ? 'Готово к обучению' : 'Заблокировано'}</span>
          </section>
          <section className='cabinet-section cabinet-locked-section'>
            <p className='cabinet-eyebrow'>Этап 04 · Участвуй в турнирах</p>
            <i className={`fa-solid ${summary.testPassed ? 'fa-trophy' : 'fa-lock'} cabinet-feature-icon`}></i>
            <h2>Турнирная готовность</h2>
            <p>{summary.testPassed ? 'Следующий шаг — подготовить змейку в школе и проверить её навыки на общей арене.' : 'Турниры откроются после подтверждения мастерства и подготовки змейки.'}</p>
            <span className='cabinet-status'>{summary.testPassed ? 'Нужна подготовка змейки' : 'Путь ещё не завершён'}</span>
          </section>
        </div>

        <section className='cabinet-section' id='history'>
          <div className='cabinet-section-heading'><div><p className='cabinet-eyebrow'>Все данные</p><h2>История сессий</h2></div><span>{sessions.length} записей</span></div>
          {sessions.length === 0 ? <p className='cabinet-empty'>Сыграй первый уровень — результаты появятся здесь.</p> : (
            <div className='cabinet-history-list'>
              {sessions.map((session) => (
                <article key={session.id}>
                  <span className='cabinet-history-level'>Ур. {session.levelNumber}</span>
                  <span>{session.gameMode === 'training' ? 'Тренировка' : 'Игра'}</span>
                  <strong>{session.score}/{session.maxScore} очков</strong>
                  <span>{session.appleTimeOverrunAvg === null ? 'Маршрут: —' : `Маршрут: ${session.appleTimeOverrunAvg.toFixed(2)}×`}</span>
                  <span>{session.status === 'game_over' ? 'Не завершён' : 'Завершён'}</span>
                  <time dateTime={session.createdAt}>{formatDate(session.createdAt)}</time>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default PersonalCabinet
