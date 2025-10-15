'use client'

import React from 'react'
import type { Workout } from '@/payload-types'

interface WorkoutStatsProps {
  workouts: Workout[]
  selectedDate: string | null
}

interface WorkoutStats {
  totalTonnage: number // Общий тоннаж в кг
  totalSets: number // Общее количество подходов
  totalReps: number // Общее количество повторений
  totalDuration: number // Общая длительность кардио в минутах
  maxWeight: number // Максимальный вес
  maxReps: number // Максимальное количество повторений
  exerciseCount: number // Количество упражнений
  strengthExercises: number // Количество силовых упражнений
  cardioExercises: number // Количество кардио упражнений
}

export default function WorkoutStats({ workouts, selectedDate }: WorkoutStatsProps) {
  // Функция для форматирования времени из минут в мм:сс
  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return '00:00'

    const totalSeconds = Math.round(minutes * 60)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  const calculateStats = (workouts: Workout[]): WorkoutStats => {
    let totalTonnage = 0
    let totalSets = 0
    let totalReps = 0
    let totalDuration = 0
    let maxWeight = 0
    let maxReps = 0
    let exerciseCount = 0
    let strengthExercises = 0
    let cardioExercises = 0

    workouts.forEach((workout) => {
      workout.exercises?.forEach((exercise) => {
        exerciseCount++

        if (exercise.exerciseType === 'strength') {
          strengthExercises++

          exercise.sets?.forEach((set) => {
            if (set.reps && set.weight) {
              const reps = parseInt(set.reps) || 0
              const weight = parseFloat(set.weight) || 0

              totalSets++
              totalReps += reps
              totalTonnage += reps * weight
              maxWeight = Math.max(maxWeight, weight)
              maxReps = Math.max(maxReps, reps)
            }
          })
        } else if (exercise.exerciseType === 'cardio') {
          cardioExercises++

          exercise.sets?.forEach((set) => {
            if (set.duration) {
              const durationStr = set.duration.trim()
              let minutes = 0

              if (durationStr.includes(':')) {
                // Формат "мм:сс" или "чч:мм:сс"
                const parts = durationStr.split(':').map(Number)
                if (parts.length === 2) {
                  // мм:сс
                  minutes = parts[0] + (parts[1] || 0) / 60
                } else if (parts.length === 3) {
                  // чч:мм:сс
                  minutes = parts[0] * 60 + parts[1] + (parts[2] || 0) / 60
                }
              } else {
                // Просто число - определяем формат по значению
                // Логика: если число <= 300, считаем секундами (разумный максимум для одного подхода)
                // Если больше 300, считаем минутами (длительные кардио сессии)
                const num = parseFloat(durationStr)
                if (!isNaN(num)) {
                  if (num <= 300) {
                    // Секунды -> минуты
                    minutes = num / 60
                  } else {
                    // Уже минуты
                    minutes = num
                  }
                }
              }

              totalDuration += minutes
              totalSets++
            }
          })
        }
      })
    })

    return {
      totalTonnage: Math.round(totalTonnage * 100) / 100,
      totalSets,
      totalReps,
      totalDuration: Math.round(totalDuration * 100) / 100,
      maxWeight,
      maxReps,
      exerciseCount,
      strengthExercises,
      cardioExercises,
    }
  }

  const stats = calculateStats(workouts)

  if (!selectedDate || workouts.length === 0) {
    return (
      <section className="stats-section">
        <h2>Статистика дня</h2>
        <div className="stats-placeholder">
          <p>Выберите день с тренировками для просмотра статистики</p>
        </div>
      </section>
    )
  }

  return (
    <section className="stats-section">
      <h2>
        Статистика дня <span className="date-info">({formatDate(selectedDate)})</span>
      </h2>
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-value">{stats.totalTonnage.toLocaleString()}</div>
          <div className="stat-label">кг общий тоннаж</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.totalSets}</div>
          <div className="stat-label">подходов</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.totalReps}</div>
          <div className="stat-label">повторений</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.exerciseCount}</div>
          <div className="stat-label">упражнений</div>
        </div>

        {stats.maxWeight > 0 && (
          <div className="stat-card">
            <div className="stat-value">{stats.maxWeight}</div>
            <div className="stat-label">кг макс. вес</div>
          </div>
        )}

        {stats.maxReps > 0 && (
          <div className="stat-card">
            <div className="stat-value">{stats.maxReps}</div>
            <div className="stat-label">макс. повторов</div>
          </div>
        )}

        {stats.totalDuration > 0 && (
          <div className="stat-card">
            <div className="stat-value">{formatDuration(stats.totalDuration)}</div>
            <div className="stat-label">кардио</div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-value">{stats.strengthExercises}</div>
          <div className="stat-label">силовых</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.cardioExercises}</div>
          <div className="stat-label">кардио</div>
        </div>
      </div>
    </section>
  )
}
