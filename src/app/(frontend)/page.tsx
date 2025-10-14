import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import HomePageComponent from './components/HomePage'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Получаем все тренировки для построения сетки активности
  const workouts = await payload.find({
    collection: 'workouts',
    limit: 1000,
    sort: '-date',
  })

  // Получаем последние тренировки для использования в качестве шаблонов
  const recentWorkouts = await payload.find({
    collection: 'workouts',
    limit: 10,
    sort: '-createdAt',
  })

  return (
    <div className="home">
      <HomePageComponent initialWorkouts={workouts.docs} recentWorkouts={recentWorkouts.docs} />
    </div>
  )
}
