import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import config from '@/payload.config'

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const workout = await payload.create({
      collection: 'workouts',
      data: {
        name: body.name,
        date: body.date,
        template: body.template || null,
        exercises: body.exercises.map((exercise: any) => ({
          ...exercise,
          exerciseType: exercise.exerciseType || 'strength',
        })),
        notes: body.notes,
        duration: body.duration ? parseInt(body.duration) : null,
      },
    })

    return NextResponse.json(workout, { status: 201 })
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json({ error: 'Failed to create workout' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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
