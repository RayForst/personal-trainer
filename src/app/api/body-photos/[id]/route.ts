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
    const formData = await request.formData()
    const date = formData.get('date') as string | null
    const removePhoto = formData.get('removePhoto') as string | null

    const data: Record<string, unknown> = {}
    if (date) data.date = date

    const keysToRemove = removePhoto ? removePhoto.split(',') : []
    for (const key of PHOTO_KEYS) {
      if (keysToRemove.includes(key)) {
        data[key] = null
      } else {
        const file = formData.get(key) as File | null
        const uploadedId = await uploadFile(payload, file, `Body photo ${key}`)
        if (uploadedId) data[key] = uploadedId
      }
    }

    const record = await payload.update({
      collection: 'body-photos',
      id,
      data,
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating body photos:', error)
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
      collection: 'body-photos',
      id,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting body photos:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления записи' },
      { status: 500 },
    )
  }
}
