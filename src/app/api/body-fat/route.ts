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
      collection: 'body-fat',
      sort: '-date',
      limit: 500,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching body fat:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки записей' },
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
    const value = body.value != null ? Number(body.value) : null
    const date = body.date ?? new Date().toISOString().split('T')[0]

    if (value == null || Number.isNaN(value) || value < 0 || value > 100) {
      return NextResponse.json(
        { error: 'Укажите процент от 0 до 100' },
        { status: 400 },
      )
    }

    const record = await payload.create({
      collection: 'body-fat',
      data: {
        value: Math.round(value * 10) / 10,
        date,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating body fat:', error)
    return NextResponse.json(
      { error: 'Ошибка сохранения записи' },
      { status: 500 },
    )
  }
}
