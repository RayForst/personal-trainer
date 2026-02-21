import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import React from 'react'
import Link from 'next/link'

import config from '@/payload.config'
import { isAuthenticated } from '@/lib/auth'
import type { Workout } from '@/payload-types'
import WorkoutList from './components/WorkoutList'

interface PageProps {
  params: Promise<{
    date: string
  }>
}

export default async function WorkoutDayPage({ params }: PageProps) {
  // Проверяем авторизацию
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }

  const { date } = await params

  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Получаем тренировки за указанную дату
  const workouts = await payload.find({
    collection: 'workouts',
    where: {
      date: {
        equals: date,
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
    <div className="min-h-screen py-8 px-8 max-w-[800px] mx-auto">
      <div className="text-left mb-8 pb-4 border-b-2 border-gray-200">
        <Link
          href="/"
          className="text-blue-600 no-underline font-medium mb-4 inline-block transition-colors hover:text-blue-700 hover:underline"
        >
          ← Назад к дневнику
        </Link>
        <h1 className="text-3xl m-0 text-gray-800">Тренировки за {formatDate(date)}</h1>
      </div>

      <WorkoutList initialWorkouts={workouts.docs} />
    </div>
  )
}
