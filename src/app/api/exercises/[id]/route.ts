import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')
    return authToken?.value === 'authenticated'
  } catch {
    return false
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params

  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const updateData: any = {
      name: body.name,
      exerciseType: body.exerciseType || 'strength',
      muscleGroup: body.muscleGroup || null,
      description: body.description || null,
      notes: body.notes || null,
    }

    const updatedExercise = await payload.update({
      collection: 'exercises',
      id,
      data: updateData,
    })

    return NextResponse.json(updatedExercise)
  } catch (error) {
    console.error('Error updating exercise:', error)
    return NextResponse.json({ error: 'Failed to update exercise' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params

  try {
    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'exercises',
      id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exercise:', error)
    return NextResponse.json({ error: 'Failed to delete exercise' }, { status: 500 })
  }
}
