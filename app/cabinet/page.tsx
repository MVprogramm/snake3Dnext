import type { Metadata } from 'next'
import PersonalCabinet from '../../src/components/PersonalCabinet'

export const metadata: Metadata = {
  title: 'Личный кабинет — Snake 3D',
  description: 'Прогресс обучения, профиль мастерства и подготовка змейки к турнирам.',
}

export default function CabinetPage() {
  return <PersonalCabinet />
}
