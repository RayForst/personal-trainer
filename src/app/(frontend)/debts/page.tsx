import { redirect } from 'next/navigation'
import React from 'react'

import { isAuthenticated } from '@/lib/auth'
import DebtsPageComponent from './components/DebtsPage'

export default async function DebtsPage() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }

  return <DebtsPageComponent />
}
