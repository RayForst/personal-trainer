import { redirect } from 'next/navigation'
import React from 'react'

import { isAuthenticated } from '@/lib/auth'
import GoalsPageComponent from './components/GoalsPage'

export default async function GoalsPage() {
  // Проверяем авторизацию
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }

  return <GoalsPageComponent />
}
