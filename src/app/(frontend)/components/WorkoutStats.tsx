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
              // Парсим время в формате "мм:сс" или просто число (минуты)
              const durationStr = set.duration
              let minutes = 0

              if (durationStr.includes(':')) {
                const [mins, secs] = durationStr.split(':').map(Number)
                minutes = mins + (secs || 0) / 60
              } else {
                minutes = parseFloat(durationStr) || 0
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
      <h2>Статистика дня</h2>
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
            <div className="stat-value">{stats.totalDuration}</div>
            <div className="stat-label">мин кардио</div>
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
