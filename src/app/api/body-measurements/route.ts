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

function parseMeasurement(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) || n < 1 || n > 300 ? null : Math.round(n * 10) / 10
}

const MEASUREMENT_KEYS = [
  'neck',
  'shoulders',
  'chest',
  'waist',
  'hips',
  'biceps',
  'forearm',
  'thigh',
  'calf',
] as const

export async function GET() {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'body-measurements',
      sort: '-date',
      limit: 500,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching body measurements:', error)
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
    const date = body.date ?? new Date().toISOString().split('T')[0]

    const data: Record<string, unknown> = { date }
    for (const key of MEASUREMENT_KEYS) {
      const val = parseMeasurement(body[key])
      if (val != null) {
        data[key] = val
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await payload.create({
      collection: 'body-measurements',
      data: data as any,
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating body measurements:', error)
    return NextResponse.json(
      { error: 'Ошибка сохранения записи' },
      { status: 500 },
    )
  }
}
