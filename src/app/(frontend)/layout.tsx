import React from 'react'
import './styles.css'

export const metadata = {
  description: 'Дневник тренировок - отслеживайте свои тренировки и прогресс',
  title: 'Дневник тренировок',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
