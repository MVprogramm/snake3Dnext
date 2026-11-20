import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import IconStylesheet from '../src/components/IconStylesheet'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Snake 3D — пройди путь от ученика до тренера',
  description: 'Освой девять учебных уровней, пройди тест мастерства, научи свою змейку и подготовь её к автономным турнирам.',
  openGraph: {
    title: 'Snake 3D — пройди путь от ученика до тренера',
    description: 'Освой игру, стань мастером, научи змейку и участвуй в турнирах.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Snake 3D — вырасти чемпиона' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snake 3D — пройди путь от ученика до тренера',
    description: 'Освой игру, стань мастером, научи змейку и участвуй в турнирах.',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='ru'>
      <head>
        <IconStylesheet />
      </head>
      <body>{children}</body>
    </html>
  )
}
