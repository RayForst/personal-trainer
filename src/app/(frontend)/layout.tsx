import React from 'react'
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
        <Header />
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
