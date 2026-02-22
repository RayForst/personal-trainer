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

export async function PATCH(
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
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const amount = body.amount != null ? Number(body.amount) : null
    const targetDate = body.targetDate ?? null
    const priority = ['low', 'normal', 'high'].includes(body.priority) ? body.priority : 'normal'
    const notes = typeof body.notes === 'string' ? body.notes.trim() : undefined

    if (!name) {
      return NextResponse.json(
        { error: 'Укажите название' },
        { status: 400 },
      )
    }

    if (amount == null || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Укажите корректную сумму (число больше 0)' },
        { status: 400 },
      )
    }

    const record = await payload.update({
      collection: 'desired-expenses',
      id,
      data: {
        name,
        amount: Math.round(amount * 100) / 100,
        targetDate: targetDate || undefined,
        priority,
        notes: notes || undefined,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating desired expense:', error)
    return NextResponse.json(
      { error: 'Ошибка сохранения записи' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
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
      collection: 'desired-expenses',
      id,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting desired expense:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления записи' },
      { status: 500 },
    )
  }
}
