function HomeButton() {
  function returnHome(): void {
    window.location.assign('/')
  }

  return (
    <button
      className='home-button'
      type='button'
      onClick={returnHome}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchEnd={(event) => event.stopPropagation()}
      aria-label='Вернуться на главную страницу'
      title='На главную'
    >
      <i className='fa-solid fa-arrow-left' aria-hidden='true'></i>
      <svg width='24' height='24' viewBox='0 0 24 24' fill='none'
        stroke='currentColor' strokeWidth='1.8' strokeLinecap='round'
        strokeLinejoin='round' aria-hidden='true' focusable='false'>
        <path d='M3 10.5 12 3l9 7.5' />
        <path d='M5 9v12h14V9M9 21v-8h6v8' />
      </svg>
    </button>
  )
}

export default HomeButton
