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
      collection: 'incomes',
      sort: 'source',
      limit: 500,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching incomes:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки доходов' },
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
    const amount = body.amount != null ? Number(body.amount) : null
    const source = typeof body.source === 'string' ? body.source.trim() : ''
    const receiptDate = body.receiptDate ?? undefined

    if (!source) {
      return NextResponse.json(
        { error: 'Укажите источник дохода' },
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
      collection: 'incomes',
      data: {
        amount: Math.round(amount * 100) / 100,
        source,
        receiptDate: receiptDate || undefined,
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating income:', error)
    return NextResponse.json(
      { error: 'Ошибка сохранения записи' },
      { status: 500 },
    )
  }
}
