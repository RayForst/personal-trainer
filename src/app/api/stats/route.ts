import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
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

export async function GET() {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })

    const [exercisesRes, workoutsRes, lastWorkoutRes] = await Promise.all([
      payload.find({
        collection: 'exercises',
        limit: 0,
      }),
      payload.find({
        collection: 'workouts',
        limit: 10000,
        depth: 2,
        where: {
          isSkip: { not_equals: true },
        },
      }),
      payload.find({
        collection: 'workouts',
        limit: 1,
        sort: '-date',
        where: {
          isSkip: { not_equals: true },
        },
      }),
    ])

    let maxWeight = 0
    let totalVolume = 0

    workoutsRes.docs.forEach((workout) => {
      workout.exercises?.forEach((exercise) => {
        if (exercise.exerciseType === 'strength' && exercise.sets) {
          exercise.sets.forEach((set) => {
            const reps = parseInt(String(set.reps || 0)) || 0
            const weight = parseFloat(String(set.weight || 0)) || 0
            if (reps && weight) {
              totalVolume += reps * weight
              maxWeight = Math.max(maxWeight, weight)
            }
          })
        }
      })
    })

    const lastWorkout = lastWorkoutRes.docs[0]
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let daysSinceLastWorkout: number | null = null
    if (lastWorkout?.date) {
      const lastDate = new Date(lastWorkout.date)
      lastDate.setHours(0, 0, 0, 0)
      daysSinceLastWorkout = Math.floor(
        (today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000),
      )
    }

    return NextResponse.json({
      exercisesCount: exercisesRes.totalDocs,
      workoutsCount: workoutsRes.totalDocs,
      maxWeight: Math.round(maxWeight * 10) / 10,
      totalVolume: Math.round(totalVolume),
      daysSinceLastWorkout,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки статистики' },
      { status: 500 },
    )
  }
}
