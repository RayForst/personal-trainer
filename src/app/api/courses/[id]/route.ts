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

export async function PUT(
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
    const body = await request.json()

    const updateData: Record<string, unknown> = {
      title: body.title,
      category: body.category || 'react',
      duration: body.duration,
      status: body.status || 'planned',
      source: body.source,
      link: body.link ?? null,
      description: body.description ?? null,
      backgroundImageUrl: body.backgroundImageUrl ?? null,
      backgroundGradient: body.backgroundGradient ?? null,
    }
    if (body.backgroundImage !== undefined) {
      updateData.backgroundImage = body.backgroundImage
    }

    const updated = await payload.update({
      collection: 'courses',
      id,
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
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
      collection: 'courses',
      id,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
