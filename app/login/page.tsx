import type { Metadata } from 'next'
import AuthPage from '../../src/components/AuthPage'

export const metadata: Metadata = { title: 'Вход — Snake 3D' }

export default function LoginPage() {
  return <AuthPage mode='sign-in' />
}
