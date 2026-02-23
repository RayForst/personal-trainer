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

    const data: Record<string, unknown> = {}
    if (body.date != null) {
      data.date = body.date
    }
    for (const key of MEASUREMENT_KEYS) {
      const val = parseMeasurement(body[key])
      if (val != null) {
        data[key] = val
      } else if (body[key] === '' || body[key] === null) {
        data[key] = null
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = await payload.update({
      collection: 'body-measurements',
      id,
      data: data as any,
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating body measurements:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления записи' },
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
      collection: 'body-measurements',
      id,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting body measurements:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления записи' },
      { status: 500 },
    )
  }
}
