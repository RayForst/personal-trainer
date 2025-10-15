'use client'

import React from 'react'
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

  const getIntensityColor = (workoutCount: number) => {
    if (workoutCount === 0) return '#ebedf0'
    if (workoutCount === 1) return '#c6e48b'
    if (workoutCount === 2) return '#7bc96f'
    if (workoutCount === 3) return '#239a3b'
    return '#196127'
  }

  const getTooltipText = (day: (typeof days)[0]) => {
    if (day.workouts.length === 0) {
      return `${day.date}: Нет тренировок`
    }
    const workoutNames = day.workouts.map((w) => w.name).join(', ')
    return `${day.date}: ${day.workouts.length} тренировка(ок) - ${workoutNames}`
  }

  return (
    <div className="workout-grid">
      <div className="grid-header">
        <div className="grid-legend">
          <span>Меньше</span>
          <div className="legend-squares">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="legend-square"
                style={{ backgroundColor: getIntensityColor(level) }}
              />
            ))}
          </div>
          <span>Больше</span>
        </div>
      </div>

      <div className="grid-container">
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
                    backgroundColor: getIntensityColor(day.workouts.length),
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
