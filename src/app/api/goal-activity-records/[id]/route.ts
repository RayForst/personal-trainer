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

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Проверяем авторизацию
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params

  try {
    const payload = await getPayload({ config })
    const formData = await request.formData()

    const date = formData.get('date') as string
    const value = formData.get('value') as string

    // КРИТИЧНО: Проверяем, что goalId не передается - мы НИКОГДА не должны изменять цель
    const goalId = formData.get('goalId')
    if (goalId) {
      console.warn('WARNING: Attempted to update goalId in activity record. Ignoring goalId parameter.')
    }

    // Правильно парсим значение
    let parsedValue: number
    if (!value || value.trim() === '') {
      parsedValue = 0
    } else {
      const normalizedValue = value.replace(',', '.')
      parsedValue = parseFloat(normalizedValue)
      if (isNaN(parsedValue)) {
        parsedValue = 0
      }
    }

    // ВАЖНО: Обновляем ТОЛЬКО date и value, НЕ трогаем goal (связь с целью)
    const recordData: any = {
      date,
      value: parsedValue,
    }

    // Получаем текущую запись, чтобы убедиться, что goal не изменяется
    const existingRecord = await payload.findByID({
      collection: 'goal-activity-records',
      id,
    })

    if (!existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Обновляем только date и value, сохраняя исходную связь с goal
    const updatedRecord = await payload.update({
      collection: 'goal-activity-records',
      id,
      data: recordData,
    })

    // Логируем для отладки
    console.log('Updated activity record:', {
      recordId: id,
      goalId: existingRecord.goal,
      date,
      value: parsedValue,
    })

    return NextResponse.json(updatedRecord)
  } catch (error) {
    console.error('Error updating goal activity record:', error)
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Проверяем авторизацию
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params

  try {
    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'goal-activity-records',
      id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal activity record:', error)
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
  }
}

