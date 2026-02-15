'use client'

import React, { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { Workout } from '@/payload-types'

// Регистрируем компоненты Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

interface ExerciseChartProps {
  workouts: Workout[]
}

interface DataPoint {
  date: string
  maxWeight: number
  totalVolume: number
  maxReps: number
  avgWeight: number
  totalDuration: number
  totalDistance: number
}

type MetricType = 'maxWeight' | 'totalVolume' | 'maxReps' | 'avgWeight'
type CardioMetricType = 'totalDuration' | 'totalDistance'

// Палитра цветов для линий
const COLORS = [
  '#667eea',
  '#28a745',
  '#dc3545',
  '#fd7e14',
  '#17a2b8',
  '#6f42c1',
  '#e83e8c',
  '#20c997',
  '#ffc107',
  '#6c757d',
  '#007bff',
  '#343a40',
]

export default function ExerciseChart({ workouts }: ExerciseChartProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('__all__')
  const [metricType, setMetricType] = useState<MetricType>('maxWeight')
  const [cardioMetric, setCardioMetric] = useState<CardioMetricType>('totalDuration')

  // Дата год назад для фильтрации
  const oneYearAgo = useMemo(() => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 1)
    return date
  }, [])

  // Фильтруем тренировки за последний год
  const yearWorkouts = useMemo(() => {
    return workouts.filter((workout) => {
      const workoutDate = new Date(workout.date)
      return workoutDate >= oneYearAgo && !workout.isSkip
    })
  }, [workouts, oneYearAgo])

  // Получаем уникальные названия упражнений и их типы
  const exerciseInfo = useMemo(() => {
    const exerciseMap = new Map<string, { type: 'strength' | 'cardio'; count: number }>()

    yearWorkouts.forEach((workout) => {
      workout.exercises?.forEach((exercise) => {
        const name = exercise.name.trim().toLowerCase()
        const existing = exerciseMap.get(name)
        if (existing) {
          existing.count++
        } else {
          exerciseMap.set(name, { type: exercise.exerciseType, count: 1 })
        }
      })
    })

    return Array.from(exerciseMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([name, info]) => ({
        name,
        displayName: name.charAt(0).toUpperCase() + name.slice(1),
        type: info.type,
        count: info.count,
      }))
  }, [yearWorkouts])

  // Получаем все уникальные даты для оси X
  const allDates = useMemo(() => {
    const dateSet = new Set<string>()
    yearWorkouts.forEach((workout) => {
      const dateKey = new Date(workout.date).toISOString().split('T')[0]
      dateSet.add(dateKey)
    })
    return Array.from(dateSet).sort()
  }, [yearWorkouts])

  // Собираем данные для каждого упражнения
  const exerciseDataMap = useMemo(() => {
    const dataMap = new Map<string, Map<string, DataPoint>>()

    yearWorkouts.forEach((workout) => {
      const dateKey = new Date(workout.date).toISOString().split('T')[0]

      workout.exercises?.forEach((exercise) => {
        const exerciseName = exercise.name.trim().toLowerCase()

        if (!dataMap.has(exerciseName)) {
          dataMap.set(exerciseName, new Map())
        }

        const exerciseData = dataMap.get(exerciseName)!

        let maxWeight = 0
        let totalVolume = 0
        let maxReps = 0
        let totalWeight = 0
        let weightCount = 0
        let totalDuration = 0
        let totalDistance = 0

        exercise.sets?.forEach((set) => {
          const weight = parseFloat(set.weight || '0') || 0
          const reps = parseInt(set.reps || '0') || 0

          if (weight > 0 || reps > 0) {
            maxWeight = Math.max(maxWeight, weight)
            maxReps = Math.max(maxReps, reps)
            totalVolume += weight * reps

            if (weight > 0) {
              totalWeight += weight
              weightCount++
            }
          }

          if (set.duration) {
            const durationStr = set.duration.trim()
            let minutes = 0

            if (durationStr.includes(':')) {
              const parts = durationStr.split(':').map(Number)
              if (parts.length === 2) {
                minutes = parts[0] + (parts[1] || 0) / 60
              } else if (parts.length === 3) {
                minutes = parts[0] * 60 + parts[1] + (parts[2] || 0) / 60
              }
            } else {
              const num = parseFloat(durationStr)
              if (!isNaN(num)) {
                minutes = num <= 300 ? num / 60 : num
              }
            }
            totalDuration += minutes
          }

          if (set.distance) {
            totalDistance += parseFloat(set.distance) || 0
          }
        })

        const avgWeight = weightCount > 0 ? Math.round((totalWeight / weightCount) * 10) / 10 : 0

        const existing = exerciseData.get(dateKey)
        if (existing) {
          existing.maxWeight = Math.max(existing.maxWeight, maxWeight)
          existing.maxReps = Math.max(existing.maxReps, maxReps)
          existing.totalVolume += totalVolume
          existing.totalDuration += totalDuration
          existing.totalDistance += totalDistance
        } else {
          exerciseData.set(dateKey, {
            date: dateKey,
            maxWeight,
            totalVolume,
            maxReps,
            avgWeight,
            totalDuration: Math.round(totalDuration * 100) / 100,
            totalDistance: Math.round(totalDistance * 100) / 100,
          })
        }
      })
    })

    return dataMap
  }, [yearWorkouts])

  // Определяем какие упражнения показывать
  const exercisesToShow = useMemo(() => {
    if (selectedExercise === '__all__') {
      // Показываем все силовые или все кардио в зависимости от выбранной метрики
      const isStrengthMetric = ['maxWeight', 'totalVolume', 'maxReps', 'avgWeight'].includes(
        metricType,
      )
      return exerciseInfo.filter((e) =>
        isStrengthMetric ? e.type === 'strength' : e.type === 'cardio',
      )
    }
    return exerciseInfo.filter((e) => e.name === selectedExercise)
  }, [selectedExercise, exerciseInfo, metricType])

  // Определяем текущую метрику
  const selectedExerciseInfo = useMemo(() => {
    if (selectedExercise === '__all__') return null
    return exerciseInfo.find((e) => e.name === selectedExercise)
  }, [exerciseInfo, selectedExercise])

  const isStrength =
    selectedExercise === '__all__' ||
    !selectedExerciseInfo ||
    selectedExerciseInfo.type === 'strength'
  const currentMetric = isStrength ? metricType : cardioMetric

  // Формируем labels для графика (только даты, где есть данные для показываемых упражнений)
  const chartLabels = useMemo(() => {
    const datesWithData = new Set<string>()
    exercisesToShow.forEach((exercise) => {
      const data = exerciseDataMap.get(exercise.name)
      if (data) {
        data.forEach((_, date) => datesWithData.add(date))
      }
    })
    return Array.from(datesWithData)
      .sort()
      .map((date) => {
        const d = new Date(date)
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
      })
  }, [exercisesToShow, exerciseDataMap])

  const sortedDates = useMemo(() => {
    const datesWithData = new Set<string>()
    exercisesToShow.forEach((exercise) => {
      const data = exerciseDataMap.get(exercise.name)
      if (data) {
        data.forEach((_, date) => datesWithData.add(date))
      }
    })
    return Array.from(datesWithData).sort()
  }, [exercisesToShow, exerciseDataMap])

  // Конфигурация Chart.js
  const chartConfig = useMemo(() => {
    const datasets = exercisesToShow.map((exercise, index) => {
      const exerciseData = exerciseDataMap.get(exercise.name)
      const color = COLORS[index % COLORS.length]

      const values = sortedDates.map((date) => {
        const point = exerciseData?.get(date)
        return point ? (point[currentMetric as keyof DataPoint] as number) : null
      })

      return {
        label: exercise.displayName,
        data: values,
        borderColor: color,
        backgroundColor: `${color}20`,
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        spanGaps: true,
      }
    })

    return {
      labels: chartLabels,
      datasets,
    }
  }, [exercisesToShow, exerciseDataMap, sortedDates, chartLabels, currentMetric])

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'maxWeight':
        return 'Макс. вес (кг)'
      case 'totalVolume':
        return 'Объём (кг)'
      case 'maxReps':
        return 'Макс. повторений'
      case 'avgWeight':
        return 'Средний вес (кг)'
      case 'totalDuration':
        return 'Время (мин)'
      case 'totalDistance':
        return 'Дистанция (км)'
      default:
        return metric
    }
  }

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            font: {
              size: 12,
            },
            color: '#495057',
            usePointStyle: false,
            padding: 15,
            boxWidth: 30,
            boxHeight: 2,
          },
        },
        tooltip: {
          backgroundColor: 'white',
          titleColor: '#2c3e50',
          bodyColor: '#495057',
          borderColor: '#e9ecef',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            label: (context: TooltipItem<'line'>) => {
              const value = context.parsed.y
              if (value === null) return ''
              return ` ${context.dataset.label || ''}: ${value.toLocaleString()} ${getMetricLabel(currentMetric).split('(')[1]?.replace(')', '') || ''}`
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: '#e9ecef',
          },
          ticks: {
            color: '#6c757d',
            font: {
              size: 10,
            },
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: false,
          grid: {
            color: '#e9ecef',
          },
          ticks: {
            color: '#6c757d',
            font: {
              size: 11,
            },
          },
          title: {
            display: true,
            text: getMetricLabel(currentMetric),
            color: '#6c757d',
            font: {
              size: 12,
            },
          },
        },
      },
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
    }),
    [currentMetric],
  )

  // Статистика
  const stats = useMemo(() => {
    if (exercisesToShow.length === 0) return null

    let totalWorkouts = 0
    let bestWeight = 0
    let totalVolume = 0
    let totalDuration = 0
    let totalDistance = 0

    exercisesToShow.forEach((exercise) => {
      const data = exerciseDataMap.get(exercise.name)
      if (data) {
        totalWorkouts += data.size
        data.forEach((point) => {
          bestWeight = Math.max(bestWeight, point.maxWeight)
          totalVolume += point.totalVolume
          totalDuration += point.totalDuration
          totalDistance += point.totalDistance
        })
      }
    })

    return {
      exercises: exercisesToShow.length,
      workouts: totalWorkouts,
      bestWeight,
      totalVolume,
      totalDuration: Math.round(totalDuration),
      totalDistance: totalDistance.toFixed(1),
    }
  }, [exercisesToShow, exerciseDataMap])

  if (exerciseInfo.length === 0) {
    return (
      <section className="chart-section">
        <h2>
          Прогресс упражнений<sup>Последний год</sup>
        </h2>
        <div className="chart-placeholder">
          <p>Добавьте тренировки с упражнениями для отображения графика прогресса</p>
        </div>
      </section>
    )
  }

  const strengthExercises = exerciseInfo.filter((e) => e.type === 'strength')
  const cardioExercises = exerciseInfo.filter((e) => e.type === 'cardio')

  return (
    <section className="chart-section">
      <h2>
        Прогресс упражнений<sup>Последний год</sup>
      </h2>

      <div className="chart-controls">
        <div className="control-group">
          <label htmlFor="exercise-select">Упражнение:</label>
          <select
            id="exercise-select"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="chart-select"
          >
            <option value="__all__">— Все упражнения —</option>
            {strengthExercises.length > 0 && (
              <optgroup label="Силовые">
                {strengthExercises.map((exercise) => (
                  <option key={exercise.name} value={exercise.name}>
                    {exercise.displayName} ({exercise.count}×)
                  </option>
                ))}
              </optgroup>
            )}
            {cardioExercises.length > 0 && (
              <optgroup label="Кардио">
                {cardioExercises.map((exercise) => (
                  <option key={exercise.name} value={exercise.name}>
                    {exercise.displayName} ({exercise.count}×)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {isStrength && (
          <div className="control-group">
            <label htmlFor="metric-select">Метрика:</label>
            <select
              id="metric-select"
              value={metricType}
              onChange={(e) => setMetricType(e.target.value as MetricType)}
              className="chart-select"
            >
              <option value="maxWeight">Макс. вес</option>
              <option value="avgWeight">Средний вес</option>
              <option value="totalVolume">Объём (тоннаж)</option>
              <option value="maxReps">Макс. повторений</option>
            </select>
          </div>
        )}

        {!isStrength && (
          <div className="control-group">
            <label htmlFor="cardio-metric-select">Метрика:</label>
            <select
              id="cardio-metric-select"
              value={cardioMetric}
              onChange={(e) => setCardioMetric(e.target.value as CardioMetricType)}
              className="chart-select"
            >
              <option value="totalDuration">Время</option>
              <option value="totalDistance">Дистанция</option>
            </select>
          </div>
        )}
      </div>

      {chartConfig.datasets.length > 0 && chartLabels.length > 0 ? (
        <div className="chart-container" style={{ height: '450px' }}>
          <Line data={chartConfig} options={chartOptions} />
        </div>
      ) : (
        <div className="chart-placeholder">
          <p>Нет данных для отображения</p>
        </div>
      )}

      {stats && (
        <div className="chart-summary">
          {selectedExercise === '__all__' && (
            <div className="summary-item">
              <span className="summary-label">Упражнений:</span>
              <span className="summary-value">{stats.exercises}</span>
            </div>
          )}
          <div className="summary-item">
            <span className="summary-label">Тренировок:</span>
            <span className="summary-value">{stats.workouts}</span>
          </div>
          {isStrength && stats.bestWeight > 0 && (
            <>
              <div className="summary-item">
                <span className="summary-label">Лучший вес:</span>
                <span className="summary-value">{stats.bestWeight} кг</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Общий объём:</span>
                <span className="summary-value">{stats.totalVolume.toLocaleString()} кг</span>
              </div>
            </>
          )}
          {!isStrength && stats.totalDuration > 0 && (
            <>
              <div className="summary-item">
                <span className="summary-label">Общее время:</span>
                <span className="summary-value">{stats.totalDuration} мин</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Общая дистанция:</span>
                <span className="summary-value">{stats.totalDistance} км</span>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
