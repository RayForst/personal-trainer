import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const updatedWorkout = await payload.update({
      collection: 'workouts',
      id: params.id,
      data: {
        name: body.name,
        date: body.date,
        exercises: body.exercises.map((exercise: any) => ({
          ...exercise,
          exerciseType: exercise.exerciseType || 'strength',
        })),
        notes: body.notes,
        duration: body.duration ? parseInt(body.duration) : null,
      },
    })

    return NextResponse.json(updatedWorkout)
  } catch (error) {
    console.error('Error updating workout:', error)
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'workouts',
      id: params.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 })
  }
}
