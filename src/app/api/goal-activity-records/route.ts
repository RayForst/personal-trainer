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

    const goalId = formData.get('goalId') as string
    const date = formData.get('date') as string
    const value = formData.get('value') as string

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

    // ВАЖНО: Создаем только запись активности, НЕ изменяем цель
    const recordData = {
      goal: goalId,
      date,
      value: parsedValue,
    }

    const record = await payload.create({
      collection: 'goal-activity-records',
      data: recordData,
    })

    // Логируем для отладки
    console.log('Created activity record:', {
      recordId: record.id,
      goalId,
      date,
      value: parsedValue,
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating goal activity record:', error)
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 })
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
    const goalId = searchParams.get('goalId')

    let query: any = {
      collection: 'goal-activity-records',
      sort: '-date',
      depth: 2, // Загружаем связанную цель
    }

    if (goalId) {
      query.where = {
        goal: {
          equals: goalId,
        },
      }
    }

    const records = await payload.find(query)

    // Если указана дата, фильтруем записи
    if (date) {
      const filteredRecords = records.docs.filter((record) => {
        const recordDate = new Date(record.date).toISOString().split('T')[0]
        return recordDate === date
      })

      return NextResponse.json({ ...records, docs: filteredRecords })
    }

    return NextResponse.json(records)
  } catch (error) {
    console.error('Error fetching goal activity records:', error)
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 })
  }
}

