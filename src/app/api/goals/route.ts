import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import config from '@/payload.config'
import type { Goal } from '@/payload-types'

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
    const endDate = formData.get('endDate') as string
    const unit = formData.get('unit') as string
    const notes = formData.get('notes') as string
    const imageFile = formData.get('image') as File | null
    const imageIdFromForm = formData.get('imageId') as string | null

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
      unit: unit || '',
      notes: notes || '',
    }

    if (endDate) {
      goalData.endDate = endDate
    }

    // Используем загруженное изображение или переданный ID изображения
    if (imageId) {
      goalData.image = imageId
    } else if (imageIdFromForm) {
      goalData.image = imageIdFromForm
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

    const query = {
      collection: 'goals' as const,
      sort: '-date',
      depth: 2, // Загружаем связанное изображение
    }

    const goals = await payload.find(query)

    // Если указана дата, фильтруем цели по диапазону дат и загружаем активности
    if (date) {
      const filteredGoals = (goals.docs as Goal[]).filter((goal) => {
        const goalDate = new Date(goal.date).toISOString().split('T')[0]
        
        // Если дата начала цели больше выбранной даты, не показываем
        if (goalDate > date) {
          return false
        }
        
        // Если есть дата завершения, проверяем, что выбранная дата не позже неё
        if (goal.endDate) {
          const goalEndDate = new Date(goal.endDate).toISOString().split('T')[0]
          return date <= goalEndDate
        }
        
        // Если даты завершения нет, показываем цель
        return true
      })
      
      // Загружаем активности для выбранной даты
      const activityRecordsResponse = await payload.find({
        collection: 'goal-activity-records',
        where: {
          date: {
            equals: date,
          },
        },
        depth: 2,
      })

      // Объединяем цели с их активностями
      const goalsWithActivities = filteredGoals.map((goal) => {
        const activityRecord = activityRecordsResponse.docs.find(
          (record: any) => {
            const recordGoalId = typeof record.goal === 'object' && record.goal !== null
              ? record.goal.id
              : record.goal
            return recordGoalId === goal.id
          }
        )

        // Расширяем цель информацией об активности за этот день
        return {
          ...goal,
          activityValue: activityRecord ? activityRecord.value : null,
          activityRecordId: activityRecord ? activityRecord.id : null,
        }
      })

      // Дедуплицируем цели по названию: для каждого уникального названия показываем только одну цель
      // Приоритет: 1) цель с активностью за этот день, 2) цель с самой поздней датой начала
      const goalsByName = new Map<string, any>()
      
      goalsWithActivities.forEach((goal) => {
        const goalName = goal.name.toLowerCase().trim()
        const existingGoal = goalsByName.get(goalName)
        
        if (!existingGoal) {
          // Если такой цели ещё нет, добавляем
          goalsByName.set(goalName, goal)
        } else {
          // Если цель уже есть, выбираем приоритетную:
          // 1. Если у текущей цели есть активность, а у существующей нет - заменяем
          if (goal.activityValue !== null && existingGoal.activityValue === null) {
            goalsByName.set(goalName, goal)
          }
          // 2. Если обе имеют активность или обе не имеют - выбираем с более поздней датой начала
          else if (
            (goal.activityValue !== null) === (existingGoal.activityValue !== null)
          ) {
            const goalDate = new Date(goal.date).getTime()
            const existingDate = new Date(existingGoal.date).getTime()
            if (goalDate > existingDate) {
              goalsByName.set(goalName, goal)
            }
          }
        }
      })
      
      const uniqueGoals = Array.from(goalsByName.values())
      
      return NextResponse.json({ ...goals, docs: uniqueGoals })
    }

    return NextResponse.json(goals)
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}
