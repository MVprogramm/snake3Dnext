import AuthPanel, { type AuthMode } from './AuthPanel'

export default function AuthPage({ mode }: { mode: AuthMode }) {
  const isLogin = mode === 'sign-in'

  return (
    <main className='auth-page'>
      <div className='auth-page-content'>
        <a className='auth-page-brand' href='/'>Snake 3D</a>
        <section className='auth-page-card' aria-labelledby='auth-title'>
          <h1 id='auth-title'>{isLogin ? 'Вход' : 'Регистрация'}</h1>
          <p className='auth-page-description'>
            {isLogin ? 'Войди, чтобы продолжить свой путь и посмотреть результаты.' : 'Создай аккаунт, чтобы сохранять результаты игры и тренировок.'}
          </p>
          <AuthPanel key={mode} embedded mode={mode} />
          <p className='auth-page-switch'>
            {isLogin ? 'Ещё нет аккаунта? ' : 'Уже есть аккаунт? '}
            <a href={isLogin ? '/register' : '/login'}>
              {isLogin ? 'Зарегистрироваться' : 'Войти'}
            </a>
          </p>
        </section>
        <a className='auth-page-back' href='/'>← На главную</a>
      </div>
    </main>
  )
}
