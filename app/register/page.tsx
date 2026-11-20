import type { Metadata } from 'next'
import AuthPage from '../../src/components/AuthPage'

export const metadata: Metadata = { title: 'Регистрация — Snake 3D' }

export default function RegisterPage() {
  return <AuthPage mode='sign-up' />
}
