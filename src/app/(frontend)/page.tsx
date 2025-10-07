import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import WorkoutGrid from './components/WorkoutGrid'
import AddWorkoutForm from './components/AddWorkoutForm'
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
      <div className="header">
        <h1>Дневник тренировок</h1>
        {user && <p>Добро пожаловать, {user.email}</p>}
      </div>

      <div className="main-content">
        {/* Сетка активности */}
        <section className="activity-section">
          <h2>История тренировок</h2>
          <WorkoutGrid workouts={workouts.docs} />
        </section>

        {/* Форма добавления тренировки */}
        <section className="add-workout-section">
          <h2>Добавить тренировку</h2>
          <AddWorkoutForm templates={recentWorkouts.docs} />
        </section>
      </div>
    </div>
  )
}
