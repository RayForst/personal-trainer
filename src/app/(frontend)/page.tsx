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
  // Исключаем пропуски и группируем по уникальным названиям
  const allWorkouts = await payload.find({
    collection: 'workouts',
    limit: 1000,
    sort: '-createdAt',
    where: {
      isSkip: {
        not_equals: true,
      },
    },
  })

  // Группируем по названию и берем последнюю версию каждой тренировки по дате тренировки
  const workoutMap = new Map()
  allWorkouts.docs.forEach((workout) => {
    if (
      !workoutMap.has(workout.name) ||
      new Date(workout.date) > new Date(workoutMap.get(workout.name).date)
    ) {
      workoutMap.set(workout.name, workout)
    }
  })

  // Преобразуем в массив и сортируем по дате тренировки (последние сверху)
  const recentWorkouts = Array.from(workoutMap.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return (
    <div className="home">
      <HomePageComponent initialWorkouts={workouts.docs} recentWorkouts={recentWorkouts} />
    </div>
  )
}
