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

export async function POST(request: NextRequest) {
  // Проверяем авторизацию
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const formData = await request.formData()

    const name = formData.get('name') as string
    const date = formData.get('date') as string
    const value = formData.get('value') as string
    const unit = formData.get('unit') as string
    const notes = formData.get('notes') as string
    const imageFile = formData.get('image') as File | null

    let imageId: string | null = null

    // Если есть файл изображения, загружаем его
    if (imageFile && imageFile.size > 0) {
      try {
        // Конвертируем File в Buffer для Payload
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Создаём медиа запись через Payload
        const media = await payload.create({
          collection: 'media',
          data: {
            alt: name || 'Goal image',
          },
          file: {
            data: buffer,
            mimetype: imageFile.type,
            name: imageFile.name,
            size: imageFile.size,
          },
        })

        imageId = typeof media.id === 'string' ? media.id : String(media.id)
      } catch (error) {
        console.error('Error uploading image:', error)
        // Продолжаем без изображения, если загрузка не удалась
      }
    }

    const goalData: any = {
      name,
      date,
      value: parseFloat(value),
      unit: unit || '',
      notes: notes || '',
    }

    if (imageId) {
      goalData.image = imageId
    }

    const goal = await payload.create({
      collection: 'goals',
      data: goalData,
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  // Проверяем авторизацию
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    let query: any = {
      collection: 'goals',
      sort: '-date',
      depth: 2, // Загружаем связанное изображение
    }

    if (date) {
      query.where = {
        date: {
          equals: date,
        },
      }
    }

    const goals = await payload.find(query)

    return NextResponse.json(goals)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}
