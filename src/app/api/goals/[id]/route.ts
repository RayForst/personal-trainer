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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const endDate = formData.get('endDate') as string
    const unit = formData.get('unit') as string
    const notes = formData.get('notes') as string
    const imageFile = formData.get('image') as File | null
    const removeImage = formData.get('removeImage') === 'true'

    const goalData: any = {
      name,
      date,
      unit: unit || '',
      notes: notes || '',
    }

    if (endDate) {
      goalData.endDate = endDate
    } else {
      goalData.endDate = null
    }

    // Обработка изображения
    if (removeImage) {
      goalData.image = null
    } else if (imageFile && imageFile.size > 0) {
      try {
        // Конвертируем File в Buffer для Payload
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Создаём новую медиа запись через Payload
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

        goalData.image = typeof media.id === 'string' ? media.id : String(media.id)
      } catch (error) {
        console.error('Error uploading image:', error)
      }
    }

    const updatedGoal = await payload.update({
      collection: 'goals',
      id: params.id,
      data: goalData,
    })

    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Проверяем авторизацию
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'goals',
      id: params.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}

