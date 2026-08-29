import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Snake 3D — вырасти чемпиона',
  description: 'Тренируй свою змейку, развивай её навыки и готовь к автономным турнирным матчам на большой арене.',
  openGraph: {
    title: 'Snake 3D — вырасти чемпиона',
    description: 'Тренируй свою змейку и готовь её к автономным турнирным матчам.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Snake 3D — вырасти чемпиона' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Snake 3D — вырасти чемпиона',
    description: 'Тренируй свою змейку и готовь её к автономным турнирным матчам.',
    images: ['/og.png'],
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang='ru'>
      <head>
        <link
          rel='stylesheet'
          href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.1.1/css/all.min.css'
          crossOrigin='anonymous'
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
