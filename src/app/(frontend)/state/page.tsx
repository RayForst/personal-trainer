import { redirect } from 'next/navigation'
import React from 'react'

import { isAuthenticated } from '@/lib/auth'
import StatePageComponent from './components/StatePage'

export default async function StatePage() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }

  return <StatePageComponent />
}
