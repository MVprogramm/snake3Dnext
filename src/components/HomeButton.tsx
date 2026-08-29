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
    >
      <i className='fa-solid fa-arrow-left' aria-hidden='true'></i>
      <span>На главную</span>
    </button>
  )
}

export default HomeButton
