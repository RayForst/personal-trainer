import { redirect } from 'next/navigation'
import React from 'react'

import { isAuthenticated } from '@/lib/auth'
import ExercisesPageComponent from './components/ExercisesPage'

export default async function ExercisesPage() {
  // Проверяем авторизацию
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }

  return <ExercisesPageComponent />
}
