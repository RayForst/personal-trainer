'use client'

import React, { useRef, useEffect } from 'react'
import type { Workout } from '@/payload-types'
// import Link from 'next/link' - убираем, так как делаем SPA

interface WorkoutGridProps {
  workouts: Workout[]
  onDaySelect: (date: string) => void
}

export default function WorkoutGrid({ workouts, onDaySelect }: WorkoutGridProps) {
  // Создаем карту тренировок по датам
  const workoutsByDate = new Map<string, Workout[]>()

  workouts.forEach((workout) => {
    const date = new Date(workout.date).toISOString().split('T')[0]
    if (!workoutsByDate.has(date)) {
      workoutsByDate.set(date, [])
    }
    workoutsByDate.get(date)!.push(workout)

    // Если это пропуск с диапазоном дат, добавляем его для всех дат в диапазоне
    if (workout.isSkip && workout.skipEndDate && workout.skipEndDate !== workout.date) {
      const startDate = new Date(workout.date)
      const endDate = new Date(workout.skipEndDate)
      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0]
        if (!workoutsByDate.has(dateString)) {
          workoutsByDate.set(dateString, [])
        }
        // Добавляем копию пропуска для каждой даты в диапазоне
        workoutsByDate.get(dateString)!.push({
          ...workout,
          date: dateString,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }
  })

  // Генерируем последние 365 дней
  const today = new Date()
  const days: Array<{ date: string; workouts: Workout[]; hasWorkouts: boolean }> = []

  for (let i = 364; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split('T')[0]
    const dayWorkouts = workoutsByDate.get(dateString) || []

    days.push({
      date: dateString,
      workouts: dayWorkouts,
      hasWorkouts: dayWorkouts.length > 0,
    })
  }

  // Группируем дни по неделям
  const weeks: Array<Array<{ date: string; workouts: Workout[]; hasWorkouts: boolean }>> = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  // Создаем массив месяцев с правильными позициями для горизонтального отображения
  const monthPositions: Array<{ name: string; weekIndex: number }> = []
  let currentMonth = ''

  weeks.forEach(
    (
      week: Array<{ date: string; workouts: Workout[]; hasWorkouts: boolean }>,
      weekIndex: number,
    ) => {
      const firstDay = week[0]
      const dayDate = new Date(firstDay.date)
      const monthName = dayDate.toLocaleDateString('ru-RU', { month: 'short' })

      if (monthName !== currentMonth) {
        currentMonth = monthName
        monthPositions.push({
          name: monthName,
          weekIndex: weekIndex,
        })
      }
    },
  )

  // Цвет фона — только по реальным тренировкам (пропуски не закрашивают плитку)
  const getIntensityColor = (workouts: Workout[]) => {
    const workoutCount = workouts.filter((workout) => !workout.isSkip).length
    if (workoutCount === 0) return '#ebedf0'
    if (workoutCount === 1) return '#c6e48b'
    if (workoutCount === 2) return '#7bc96f'
    if (workoutCount === 3) return '#239a3b'
    return '#196127'
  }

  // Цвет фона для пропуска (заливка квадратика)
  const getSkipBackgroundColor = (workouts: Workout[]): string => {
    const skipWorkouts = workouts.filter((workout) => workout.isSkip)
    if (skipWorkouts.length === 0) return '#ebedf0'
    const skipColor = skipWorkouts[0].skipColor
    switch (skipColor) {
      case 'blue':
        return '#b3d7ff'
      case 'red':
        return '#e57373'
      case 'orange':
        return '#ffb74d'
      case 'yellow':
        return '#fff3cd'
      default:
        return '#b3d7ff'
    }
  }

  // Есть ли и пропуск, и тренировки в один день — тогда делим ячейку на два сектора
  const hasBothSkipAndWorkout = (workouts: Workout[]) => {
    const hasSkip = workouts.some((w) => w.isSkip)
    const hasWorkout = workouts.some((w) => !w.isSkip)
    return hasSkip && hasWorkout
  }

  const getTooltipText = (day: (typeof days)[0]) => {
    if (day.workouts.length === 0) {
      return `${day.date}: Нет тренировок`
    }

    const skipWorkouts = day.workouts.filter((workout) => workout.isSkip)
    const regularWorkouts = day.workouts.filter((workout) => !workout.isSkip)
    const skipReason =
      skipWorkouts[0] &&
      (skipWorkouts[0].skipReason === 'other'
        ? skipWorkouts[0].customReason
        : skipWorkouts[0].skipReason)

    if (regularWorkouts.length > 0) {
      const workoutNames = regularWorkouts.map((workout) => workout.name).join(', ')
      const skipPart = skipWorkouts.length > 0 ? ` (период пропуска: ${skipReason})` : ''
      return `${day.date}: ${regularWorkouts.length} тренировка(ок) - ${workoutNames}${skipPart}`
    }

    return `${day.date}: Пропуск - ${skipReason}`
  }

  const gridContainerRef = useRef<HTMLDivElement>(null)

  // Прокручиваем к правому краю (сегодня) при монтировании
  useEffect(() => {
    const container = gridContainerRef.current
    if (container) {
      container.scrollLeft = container.scrollWidth
    }
  }, [])

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Меньше</span>
          <div className="flex gap-0.5">
            {[0, 1, 2, 3, 4].map((level) => {
              const mockWorkouts = Array(level).fill({ isSkip: false })
              return (
                <div
                  key={level}
                  className="w-4 h-4 rounded-sm"
                  style={{ backgroundColor: getIntensityColor(mockWorkouts) }}
                />
              )
            })}
          </div>
          <span>Больше</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 overflow-x-auto pb-4" ref={gridContainerRef}>
        <div
          className="grid gap-[3px] mb-2 w-max"
          style={{ gridTemplateColumns: 'repeat(53, 64px)' }}
        >
          {monthPositions.map((month, index) => (
            <div
              key={`${month.name}-${index}`}
              className="text-xs text-gray-500 text-left h-3.5 leading-[14px]"
              style={{ gridColumn: month.weekIndex + 1 }}
            >
              {month.name}
            </div>
          ))}
        </div>

        <div className="flex gap-[3px] w-max">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px] shrink-0">
              {week.map((day, dayIndex) => {
                const isSplit = hasBothSkipAndWorkout(day.workouts)
                return (
                  <div
                    key={`${day.date}-${dayIndex}`}
                    className="w-16 h-16 min-w-16 min-h-16 rounded-sm overflow-hidden transition-all duration-200 outline-none shrink-0 cursor-pointer hover:shadow-[inset_0_0_0_2px_#dc3545] flex flex-col"
                    title={getTooltipText(day)}
                    onClick={() => onDaySelect(day.date)}
                  >
                    {isSplit ? (
                      <>
                        <div
                          className="flex-1 min-h-0"
                          style={{ backgroundColor: getSkipBackgroundColor(day.workouts) }}
                        />
                        <div
                          className="flex-1 min-h-0"
                          style={{ backgroundColor: getIntensityColor(day.workouts) }}
                        />
                      </>
                    ) : (
                      <div
                        className="w-full h-full rounded-sm"
                        style={{
                          backgroundColor: day.workouts.some((w) => !w.isSkip)
                            ? getIntensityColor(day.workouts)
                            : getSkipBackgroundColor(day.workouts),
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
