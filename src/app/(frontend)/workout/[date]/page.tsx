import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'

import config from '@/payload.config'
import type { Workout } from '@/payload-types'
import WorkoutList from './components/WorkoutList'

interface PageProps {
  params: {
    date: string
  }
}

export default async function WorkoutDayPage({ params }: PageProps) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Получаем тренировки за указанную дату
  const workouts = await payload.find({
    collection: 'workouts',
    where: {
      date: {
        equals: params.date,
      },
    },
    sort: '-createdAt',
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  return (
    <div className="workout-day-page">
      <div className="header">
        <Link href="/" className="back-link">
          ← Назад к дневнику
        </Link>
        <h1>Тренировки за {formatDate(params.date)}</h1>
      </div>

      <WorkoutList initialWorkouts={workouts.docs} />
    </div>
  )
}
