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

  // Цвет бордера для пропуска (травма и т.д.) — показываем обводкой 1px, а не заливкой
  const getSkipBorderColor = (workouts: Workout[]): string | null => {
    const skipWorkouts = workouts.filter((workout) => workout.isSkip)
    if (skipWorkouts.length === 0) return null
    const skipColor = skipWorkouts[0].skipColor
    switch (skipColor) {
      case 'blue':
        return '#007bff'
      case 'red':
        return '#dc3545'
      case 'orange':
        return '#fd7e14'
      case 'yellow':
        return '#ffc107'
      default:
        return '#007bff'
    }
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
    <div className="workout-grid">
      <div className="grid-header">
        <div className="grid-legend">
          <span>Меньше</span>
          <div className="legend-squares">
            {[0, 1, 2, 3, 4].map((level) => {
              // Создаем массив тренировок для каждого уровня
              const mockWorkouts = Array(level).fill({ isSkip: false })
              return (
                <div
                  key={level}
                  className="legend-square"
                  style={{ backgroundColor: getIntensityColor(mockWorkouts) }}
                />
              )
            })}
          </div>
          <span>Больше</span>
        </div>
      </div>

      <div className="grid-container" ref={gridContainerRef}>
        <div className="grid-months">
          {monthPositions.map((month, index) => (
            <div
              key={`${month.name}-${index}`}
              className="month-label"
              style={{
                gridColumn: month.weekIndex + 1,
              }}
            >
              {month.name}
            </div>
          ))}
        </div>

        <div className="grid-weeks">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="week">
              {week.map((day, dayIndex) => (
                <div
                  key={`${day.date}-${dayIndex}`}
                  className="day-square"
                  style={{
                    backgroundColor: getIntensityColor(day.workouts),
                    border: `1px solid ${getSkipBorderColor(day.workouts) ?? 'transparent'}`,
                    cursor: 'pointer',
                  }}
                  title={getTooltipText(day)}
                  onClick={() => onDaySelect(day.date)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
