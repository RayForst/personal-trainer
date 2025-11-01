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
  // Проверяем авторизацию
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    // Если это массив дат для пропуска (оптимизация)
    if (body.dates && Array.isArray(body.dates)) {
      const workouts = []
      for (const date of body.dates) {
        const workoutData = {
          name: body.name,
          date: date,
          notes: body.notes,
          isSkip: true,
          skipReason: body.skipReason,
          customReason: body.customReason,
          skipColor: body.skipColor,
          skipEndDate: body.skipEndDate,
        }

        const workout = await payload.create({
          collection: 'workouts',
          data: workoutData,
        })
        workouts.push(workout)
      }
      return NextResponse.json(workouts, { status: 201 })
    }

    // Подготавливаем данные в зависимости от типа записи
    const workoutData: any = {
      name: body.name,
      date: body.date,
      notes: body.notes,
    }

    // Если это пропуск тренировки
    if (body.isSkip) {
      workoutData.isSkip = true
      workoutData.skipReason = body.skipReason
      workoutData.customReason = body.customReason
      workoutData.skipColor = body.skipColor
      workoutData.skipEndDate = body.skipEndDate
    } else {
      // Если это обычная тренировка
      workoutData.template = body.template || null
      workoutData.exercises =
        body.exercises?.map((exercise: any) => ({
          ...exercise,
          exerciseType: exercise.exerciseType || 'strength',
        })) || []
      workoutData.duration = body.duration ? parseInt(body.duration) : null
    }

    const workout = await payload.create({
      collection: 'workouts',
      data: workoutData,
    })

    return NextResponse.json(workout, { status: 201 })
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    let query: any = {
      collection: 'workouts',
      sort: '-date',
    }

    if (date) {
      query.where = {
        date: {
          equals: date,
        },
      }
    }

    const workouts = await payload.find(query)

    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 })
  }
}
