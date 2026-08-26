import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Snake 3D',
  description: 'Тренируй змейку, собирай яблоки и контролируй арену.',
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='ru'>
      <body>{children}</body>
    </html>
  )
}
