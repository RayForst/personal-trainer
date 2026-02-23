import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import config from '@/payload.config'

const PHOTO_KEYS = ['front', 'back', 'left', 'right'] as const

async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')
    return authToken?.value === 'authenticated'
  } catch {
    return false
  }
}

async function uploadFile(
  payload: Awaited<ReturnType<typeof getPayload>>,
  file: File | null,
  alt: string,
): Promise<string | null> {
  if (!file || file.size === 0) return null
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const media = await payload.create({
    collection: 'media',
    data: { alt },
    file: {
      data: buffer,
      mimetype: file.type,
      name: file.name,
      size: file.size,
    },
  })
  return typeof media.id === 'string' ? media.id : String(media.id)
}

export async function GET(request: NextRequest) {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const result = await payload.find({
      collection: 'body-photos',
      sort: '-date',
      limit: 500,
      depth: 2,
      ...(date && {
        where: {
          date: { equals: date },
        },
      }),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching body photos:', error)
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
    const formData = await request.formData()
    const date = (formData.get('date') as string) ?? new Date().toISOString().split('T')[0]

    const data: Record<string, string> = { date }
    for (const key of PHOTO_KEYS) {
      const file = formData.get(key) as File | null
      const id = await uploadFile(payload, file, `Body photo ${key}`)
      if (id) data[key] = id
    }

    const hasPhotos = PHOTO_KEYS.some((k) => data[k])
    if (!hasPhotos) {
      return NextResponse.json(
        { error: 'Загрузите хотя бы одно фото' },
        { status: 400 },
      )
    }

    const record = await payload.create({
      collection: 'body-photos',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating body photos:', error)
    return NextResponse.json(
      { error: 'Ошибка сохранения записи' },
      { status: 500 },
    )
  }
}
