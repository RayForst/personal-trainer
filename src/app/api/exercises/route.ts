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

    const exerciseData: any = {
      name: body.name,
      exerciseType: body.exerciseType || 'strength',
      muscleGroup: body.muscleGroup || null,
      description: body.description || null,
      notes: body.notes || null,
    }

    const exercise = await payload.create({
      collection: 'exercises',
      data: exerciseData,
    })

    return NextResponse.json(exercise, { status: 201 })
  } catch (error) {
    console.error('Error creating exercise:', error)
    return NextResponse.json({ error: 'Failed to create exercise' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const muscleGroup = searchParams.get('muscleGroup')
    const exerciseType = searchParams.get('exerciseType')

    const query: any = {
      collection: 'exercises',
      sort: 'name',
      limit: 100,
    }

    const conditions: any[] = []

    if (search) {
      conditions.push({
        name: {
          like: search,
        },
      })
    }

    if (muscleGroup) {
      conditions.push({
        muscleGroup: {
          equals: muscleGroup,
        },
      })
    }

    if (exerciseType) {
      conditions.push({
        exerciseType: {
          equals: exerciseType,
        },
      })
    }

    if (conditions.length > 0) {
      query.where = {
        and: conditions,
      }
    }

    const exercises = await payload.find(query)

    return NextResponse.json(exercises)
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return NextResponse.json({ error: 'Failed to fetch exercises' }, { status: 500 })
  }
}
