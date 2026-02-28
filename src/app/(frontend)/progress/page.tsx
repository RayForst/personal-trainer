import { redirect } from 'next/navigation'

import { isAuthenticated } from '@/lib/auth'

export default async function ProgressPage() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }

  redirect('/state?tab=progress')
}
