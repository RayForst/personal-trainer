import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import config from '@/payload.config'

async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')
    return authToken?.value === 'authenticated'
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const courseData = {
      title: body.title,
      category: body.category || 'react',
      duration: body.duration,
      status: body.status || 'planned',
      source: body.source,
      link: body.link || null,
      description: body.description || null,
      backgroundImageUrl: body.backgroundImageUrl || null,
      backgroundImage: body.backgroundImage || null,
      backgroundGradient: body.backgroundGradient || null,
    }

    const course = await payload.create({
      collection: 'courses',
      data: courseData,
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}

export async function GET() {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'courses',
      sort: 'category',
      limit: 500,
      depth: 1,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}
