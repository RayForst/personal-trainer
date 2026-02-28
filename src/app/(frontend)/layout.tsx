import React, { Suspense } from 'react'
import './styles.css'
import { Toaster } from './components/Toaster'
import Header from './components/Header'

export const metadata = {
  description: 'Дневник тренировок - отслеживайте свои тренировки и прогресс',
  title: 'Дневник тренировок',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <Suspense fallback={<header className="h-[var(--header-height)] border-b border-gray-200" />}>
          <Header />
        </Suspense>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
