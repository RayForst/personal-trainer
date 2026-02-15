import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import React from 'react'

import config from '@/payload.config'
import { isAuthenticated } from '@/lib/auth'
import ProgressPageComponent from './components/ProgressPage'

export default async function ProgressPage() {
  // Проверяем авторизацию
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }

  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })

  // Получаем все тренировки для графика прогресса
  const workouts = await payload.find({
    collection: 'workouts',
    limit: 1000,
    sort: '-date',
  })

  return <ProgressPageComponent initialWorkouts={workouts.docs} />
}
