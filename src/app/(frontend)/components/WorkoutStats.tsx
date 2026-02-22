'use client'

import React, { useEffect, useState } from 'react'
import type { Workout, Goal } from '@/payload-types'
import GoalDayModal from './GoalDayModal'

interface WorkoutStatsProps {
  workouts: Workout[]
  selectedDate: string | null
  compact?: boolean
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

// Расширенный тип для цели с информацией об активности
type GoalWithActivity = Goal & {
  activityValue?: number | null
  activityRecordId?: string | null
}

export default function WorkoutStats({ workouts, selectedDate, compact = false }: WorkoutStatsProps) {
  const [goals, setGoals] = useState<GoalWithActivity[]>([])
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)

  // Функция для загрузки целей
  const fetchGoals = async (date: string) => {
    try {
      const response = await fetch(`/api/goals?date=${date}`)
      if (response.ok) {
        const data = await response.json()
        setGoals(data.docs || [])
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    }
  }

  // Загружаем цели при изменении выбранной даты
  useEffect(() => {
    if (selectedDate) {
      fetchGoals(selectedDate)
    } else {
      setGoals([])
    }
  }, [selectedDate])

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

  const cardSize = compact ? 'w-24 h-24' : 'w-40 h-40'
  const cardPadding = compact ? 'p-2' : 'p-4'
  const valueSize = compact ? 'text-base' : 'text-2xl'
  const labelSize = compact ? 'text-xs' : 'text-sm'

  const statCard = `${cardSize} flex flex-col justify-center rounded-lg ${cardPadding} text-center border border-gray-200 bg-gray-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`
  const statCardPrimary = `${cardSize} flex flex-col justify-center rounded-lg ${cardPadding} text-center border-none bg-gradient-to-br from-indigo-500 to-purple-600 text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md`

  if (!selectedDate) return null

  return (
    <section className={compact ? '' : 'bg-white rounded-xl p-6 shadow-sm'}>
      <h2 className={`m-0 text-gray-800 ${compact ? 'text-sm font-semibold mb-2' : 'text-2xl mb-6'}`}>
        Статистика дня <span className={compact ? 'text-xs text-gray-500 font-normal' : 'text-sm text-gray-500 font-normal'}>({formatDate(selectedDate)})</span>
      </h2>
      <div className={`flex flex-wrap ${compact ? 'gap-1.5' : 'gap-2'}`}>
        <div className={statCardPrimary}>
          <div className={`${valueSize} font-bold ${compact ? 'mb-0.5' : 'mb-2'}`}>{stats.totalTonnage.toLocaleString()}</div>
          <div className={`${labelSize} opacity-80`}>кг общий тоннаж</div>
        </div>

        <div className={statCard}>
          <div className={`${valueSize} font-bold ${compact ? 'mb-0.5' : 'mb-2'}`}>{stats.totalSets}</div>
          <div className={`${labelSize} text-gray-600 opacity-80`}>подходов</div>
        </div>

        <div className={statCard}>
          <div className={`${valueSize} font-bold ${compact ? 'mb-0.5' : 'mb-2'}`}>{stats.totalReps}</div>
          <div className={`${labelSize} text-gray-600 opacity-80`}>повторений</div>
        </div>

        <div className={statCard}>
          <div className={`${valueSize} font-bold ${compact ? 'mb-0.5' : 'mb-2'}`}>{stats.exerciseCount}</div>
          <div className={`${labelSize} text-gray-600 opacity-80`}>упражнений</div>
        </div>

        {stats.maxWeight > 0 && (
          <div className={statCard}>
            <div className={`${valueSize} font-bold ${compact ? 'mb-0.5' : 'mb-2'}`}>{stats.maxWeight}</div>
            <div className={`${labelSize} text-gray-600 opacity-80`}>кг макс. вес</div>
          </div>
        )}

        {stats.maxReps > 0 && (
          <div className={statCard}>
            <div className={`${valueSize} font-bold ${compact ? 'mb-0.5' : 'mb-2'}`}>{stats.maxReps}</div>
            <div className={`${labelSize} text-gray-600 opacity-80`}>макс. повторов</div>
          </div>
        )}

        {stats.totalDuration > 0 && (
          <div className={statCard}>
            <div className={`${valueSize} font-bold ${compact ? 'mb-0.5' : 'mb-2'}`}>{formatDuration(stats.totalDuration)}</div>
            <div className={`${labelSize} text-gray-600 opacity-80`}>кардио</div>
          </div>
        )}

        <div className={statCard}>
          <div className={`${valueSize} font-bold ${compact ? 'mb-0.5' : 'mb-2'}`}>{stats.strengthExercises}</div>
          <div className={`${labelSize} text-gray-600 opacity-80`}>силовых</div>
        </div>

        <div className={statCard}>
          <div className={`${valueSize} font-bold ${compact ? 'mb-0.5' : 'mb-2'}`}>{stats.cardioExercises}</div>
          <div className={`${labelSize} text-gray-600 opacity-80`}>кардио</div>
        </div>

        {/* Отображение целей */}
        {goals.map((goal) => {
          // Получаем URL изображения
          const imageUrl =
            goal.image &&
            typeof goal.image === 'object' &&
            goal.image !== null &&
            'url' in goal.image
              ? goal.image.url
              : null

          const cardStyle: React.CSSProperties = imageUrl
            ? {
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                color: 'white',
                position: 'relative',
                border: 'none',
              }
            : {}

          return (
            <div
              key={goal.id}
              className={`${statCard} cursor-pointer relative`}
              style={cardStyle}
              onClick={() => {
                setSelectedGoal(goal)
                setIsGoalModalOpen(true)
              }}
            >
              {imageUrl && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-600/25 rounded-lg z-0" />
              )}
              <div className="relative z-10">
                <div className={`${valueSize} font-bold ${compact ? 'mb-0.5' : 'mb-2'}`}>
                  {goal.activityValue !== null && goal.activityValue !== undefined
                    ? goal.activityValue.toLocaleString()
                    : '—'}
                  {goal.unit && goal.unit.toLowerCase().trim() !== 'секунд' && ` ${goal.unit}`}
                </div>
                <div className={`${labelSize} opacity-80`}>{goal.name}</div>
              </div>
              {goal.endDate && (
                <div className={`font-bold opacity-80 ${compact ? 'text-xs mt-1' : 'text-base mt-4'}`}>
                  {new Date(goal.endDate).toLocaleDateString('ru-RU')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <GoalDayModal
        goal={selectedGoal}
        date={selectedDate}
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false)
          setSelectedGoal(null)
        }}
        onUpdate={() => {
          if (selectedDate) {
            fetchGoals(selectedDate)
          }
        }}
      />
    </section>
  )
}
