import { redirect } from 'next/navigation'
import React from 'react'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { isAuthenticated } from '@/lib/auth'
import KnowledgesPageComponent from './components/KnowledgesPage'

export default async function KnowledgesPage() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect('/login')
  }

  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const result = await payload.find({
    collection: 'courses',
    sort: 'category',
    limit: 500,
    depth: 1,
  })

  return <KnowledgesPageComponent initialCourses={result.docs} />
}
