import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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
    const body = await request.json()

    // Сначала получаем текущую запись, чтобы понять, это пропуск или обычная тренировка
    const currentWorkout = await payload.findByID({
      collection: 'workouts',
      id,
    })

    // Подготавливаем данные для обновления
    const updateData: any = {
      name: body.name,
      date: body.date,
      notes: body.notes || null,
    }

    if (body.isSkip || currentWorkout.isSkip) {
      updateData.isSkip = true
      updateData.skipEndDate = body.skipEndDate || null
      updateData.skipReason = body.skipReason || null
      updateData.customReason = body.customReason || null
      updateData.skipColor = body.skipColor || null
      updateData.exercises = null
      updateData.duration = null
    } else {
      // Если это обычная тренировка
      updateData.exercises =
        body.exercises?.map((exercise: any) => ({
          ...exercise,
          exerciseType: exercise.exerciseType || 'strength',
        })) || []
      updateData.duration = body.duration ? parseInt(body.duration) : null
      updateData.isSkip = false
    }

    const updatedWorkout = await payload.update({
      collection: 'workouts',
      id,
      data: updateData,
    })

    return NextResponse.json(updatedWorkout)
  } catch (error) {
    console.error('Error updating workout:', error)
    return NextResponse.json({ error: 'Failed to update workout' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Проверяем авторизацию
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params

  try {
    const payload = await getPayload({ config })

    // Получаем удаляемую запись
    const workoutToDelete = await payload.findByID({
      collection: 'workouts',
      id,
    })

    // Если это пропуск с диапазоном дат, нужно удалить все связанные записи
    if (workoutToDelete.isSkip && workoutToDelete.skipEndDate) {
      // Находим все записи пропусков с таким же skipEndDate
      const skipEndDate = workoutToDelete.skipEndDate
      const allSkips = await payload.find({
        collection: 'workouts',
        where: {
          and: [
            {
              isSkip: {
                equals: true,
              },
            },
            {
              skipEndDate: {
                equals: skipEndDate,
              },
            },
          ],
        },
        limit: 1000,
      })

      // Находим минимальную дату среди всех записей пропуска
      let minDate = workoutToDelete.date
      for (const skip of allSkips.docs) {
        if (skip.date < minDate) {
          minDate = skip.date
        }
      }

      // Определяем диапазон дат
      const startDate = new Date(minDate)
      const endDate = new Date(skipEndDate)

      // Удаляем все записи пропусков в этом диапазоне
      const datesToDelete: string[] = []
      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        datesToDelete.push(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Удаляем все записи пропусков с этими датами и таким же skipEndDate
      for (const dateStr of datesToDelete) {
        const skipsForDate = await payload.find({
          collection: 'workouts',
          where: {
            and: [
              {
                isSkip: {
                  equals: true,
                },
              },
              {
                date: {
                  equals: dateStr,
                },
              },
              {
                skipEndDate: {
                  equals: skipEndDate,
                },
              },
            ],
          },
          limit: 1000,
        })

        for (const skip of skipsForDate.docs) {
          await payload.delete({
            collection: 'workouts',
            id: skip.id,
          })
        }
      }

      return NextResponse.json({ success: true, deletedCount: datesToDelete.length })
    } else {
      // Если это обычная тренировка или пропуск без диапазона, удаляем только эту запись
      await payload.delete({
        collection: 'workouts',
        id,
      })

      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json({ error: 'Failed to delete workout' }, { status: 500 })
  }
}
