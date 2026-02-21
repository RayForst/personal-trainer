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

export async function GET() {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'planned-payments',
      sort: 'name',
      limit: 500,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching planned payments:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки планируемых платежей' },
      { status: 500 },
    )
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
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const amount = body.amount != null ? Number(body.amount) : null
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

    const record = await payload.create({
      collection: 'planned-payments',
      data: {
        name,
        amount: Math.round(amount * 100) / 100,
        priority,
        notes: notes || undefined,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating planned payment:', error)
    return NextResponse.json(
      { error: 'Ошибка сохранения записи' },
      { status: 500 },
    )
  }
}
