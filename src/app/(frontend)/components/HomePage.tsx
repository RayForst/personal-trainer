'use client'

import React, { useState } from 'react'
import WorkoutGrid from './WorkoutGrid'
import AddWorkoutForm from './AddWorkoutForm'
import WorkoutList from '../workout/[date]/components/WorkoutList'
import type { Workout } from '@/payload-types'

interface HomePageProps {
  initialWorkouts: Workout[]
  recentWorkouts: Workout[]
}

export default function HomePage({ initialWorkouts, recentWorkouts }: HomePageProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDateWorkouts, setSelectedDateWorkouts] = useState<Workout[]>([])
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>(initialWorkouts)

  const handleDaySelect = async (date: string) => {
    setSelectedDate(date)

    // Фильтруем тренировки за выбранную дату
    const workoutsForDate = allWorkouts.filter((workout) => {
      const workoutDate = new Date(workout.date).toISOString().split('T')[0]
      return workoutDate === date
    })

    setSelectedDateWorkouts(workoutsForDate)
  }

  const handleWorkoutUpdate = (updatedWorkout: Workout) => {
    // Обновляем тренировку в общем списке
    setAllWorkouts((prev) =>
      prev.map((workout) => (workout.id === updatedWorkout.id ? updatedWorkout : workout)),
    )

    // Обновляем тренировку в списке выбранной даты
    setSelectedDateWorkouts((prev) =>
      prev.map((workout) => (workout.id === updatedWorkout.id ? updatedWorkout : workout)),
    )
  }

  const handleWorkoutDelete = (workoutId: string) => {
    // Удаляем тренировку из общего списка
    setAllWorkouts((prev) => prev.filter((workout) => workout.id !== workoutId))

    // Удаляем тренировку из списка выбранной даты
    setSelectedDateWorkouts((prev) => prev.filter((workout) => workout.id !== workoutId))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  return (
    <div className="main-grid">
      {/* Сетка активности */}
      <section className="activity-section">
        <h2>История тренировок</h2>
        <WorkoutGrid workouts={allWorkouts} onDaySelect={handleDaySelect} />
      </section>

      {/* Заглушка или тренировки за день */}
      <section className="modal-placeholder">
        {selectedDate ? (
          <div className="workout-day-content">
            <div className="workout-day-header">
              <h3>Тренировки за {formatDate(selectedDate)}</h3>
              <button onClick={() => setSelectedDate(null)} className="close-btn">
                ×
              </button>
            </div>
            <WorkoutList
              initialWorkouts={selectedDateWorkouts}
              onWorkoutUpdate={handleWorkoutUpdate}
              onWorkoutDelete={handleWorkoutDelete}
            />
          </div>
        ) : (
          <div className="placeholder-content">
            <h3>Выберите день в истории тренировок</h3>
            <p>
              Кликните на любой квадратик в сетке активности, чтобы просмотреть тренировки за этот
              день
            </p>
          </div>
        )}
      </section>

      {/* Форма добавления тренировки */}
      <section className="add-workout-section">
        <h2>Добавить тренировку</h2>
        <AddWorkoutForm templates={recentWorkouts} />
      </section>
    </div>
  )
}
