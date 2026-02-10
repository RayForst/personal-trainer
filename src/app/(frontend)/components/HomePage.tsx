'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import WorkoutGrid from './WorkoutGrid'
import AddWorkoutForm from './AddWorkoutForm'
import WorkoutList from '../workout/[date]/components/WorkoutList'
import WorkoutStats from './WorkoutStats'
import GoalsList from './GoalsList'
import ExerciseChart from './ExerciseChart'
import type { Workout } from '@/payload-types'

interface HomePageProps {
  initialWorkouts: Workout[]
  recentWorkouts: Workout[]
}

export default function HomePage({ initialWorkouts, recentWorkouts }: HomePageProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedDateWorkouts, setSelectedDateWorkouts] = useState<Workout[]>([])
  const [allWorkouts, setAllWorkouts] = useState<Workout[]>(initialWorkouts)
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      // Все равно перенаправляем на страницу логина
      router.push('/login')
    }
  }

  const handleDaySelect = async (date: string) => {
    setSelectedDate(date)

    // Фильтруем тренировки за выбранную дату
    const workoutsForDate = allWorkouts.filter((workout) => {
      const workoutDate = new Date(workout.date).toISOString().split('T')[0]
      return workoutDate === date
    })

    setSelectedDateWorkouts(workoutsForDate)
  }

  const handleAddWorkoutClick = () => {
    setIsRightPanelOpen(true)
  }

  const handleCloseDayDetail = () => {
    setSelectedDate(null)
    setSelectedDateWorkouts([])
  }

  const handleCloseRightPanel = () => {
    setIsRightPanelOpen(false)
  }

  const handleWorkoutUpdate = (updatedWorkout: Workout) => {
    // Обновляем тренировку в общем списке
    setAllWorkouts((prev) =>
      prev.map((workout) => (workout.id === updatedWorkout.id ? updatedWorkout : workout)),
    )

    // Если дата тренировки изменилась, нужно обновить список выбранной даты
    const originalWorkout = allWorkouts.find((w) => w.id === updatedWorkout.id)
    const dateChanged = originalWorkout && originalWorkout.date !== updatedWorkout.date

    if (dateChanged && selectedDate) {
      // Если тренировка была перемещена на другую дату, удаляем её из текущего списка
      const originalDate = new Date(originalWorkout!.date).toISOString().split('T')[0]
      if (originalDate === selectedDate) {
        setSelectedDateWorkouts((prev) =>
          prev.filter((workout) => workout.id !== updatedWorkout.id),
        )
      }

      // Если тренировка была перемещена на выбранную дату, добавляем её
      const newDate = new Date(updatedWorkout.date).toISOString().split('T')[0]
      if (newDate === selectedDate) {
        setSelectedDateWorkouts((prev) => [...prev, updatedWorkout])
      }
    } else {
      // Если дата не изменилась, просто обновляем тренировку в списке выбранной даты
      setSelectedDateWorkouts((prev) =>
        prev.map((workout) => (workout.id === updatedWorkout.id ? updatedWorkout : workout)),
      )
    }
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
    <div
      className={`triptych-container ${isRightPanelOpen ? 'right-open' : ''}`}
    >
      {/* Центральная часть - История и статистика */}
      <main className="center-content">
        {/* График прогресса упражнений */}
        <ExerciseChart workouts={allWorkouts} />

        {/* Сетка активности */}
        <section className="activity-section">
          <div className="activity-header">
            <h2 style={{ marginBottom: 0 }}>История тренировок</h2>
            <div className="header-buttons">
              <button onClick={handleAddWorkoutClick} className="add-workout-btn">
                ДОБАВИТЬ
              </button>
              <button onClick={handleLogout} className="logout-btn" title="Выйти">
                Выход
              </button>
            </div>
          </div>
          <WorkoutGrid workouts={allWorkouts} onDaySelect={handleDaySelect} />

          {/* История дня под плиткой */}
          {selectedDate && (
            <div className="day-detail-block">
              <div className="day-detail-header">
                <h3 className="day-detail-title">
                  Тренировки за день{' '}
                  <span className="date-info">({formatDate(selectedDate)})</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCloseDayDetail}
                  className="day-detail-close-btn"
                >
                  ЗАКРЫТЬ
                </button>
              </div>
              {selectedDateWorkouts.length > 0 ? (
                <div className="day-detail-body">
                  <WorkoutList
                    initialWorkouts={selectedDateWorkouts}
                    onWorkoutUpdate={handleWorkoutUpdate}
                    onWorkoutDelete={handleWorkoutDelete}
                  />
                </div>
              ) : (
                <div className="day-detail-body day-detail-placeholder">
                  <p>В этот день тренировок не было</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Статистика дня */}
        <WorkoutStats workouts={selectedDateWorkouts} selectedDate={selectedDate} />

        {/* Цели */}
        <GoalsList />
      </main>

      {/* Правая выдвижная панель - Добавить тренировку */}
      <aside
        className={`right-panel ${isRightPanelOpen ? 'open' : ''}`}
        onClick={!isRightPanelOpen ? () => setIsRightPanelOpen(true) : undefined}
        title={!isRightPanelOpen ? 'Открыть форму добавления' : undefined}
      >
        {!isRightPanelOpen && (
          <div
            className="panel-tab"
            onClick={(e) => {
              e.stopPropagation()
              setIsRightPanelOpen(true)
            }}
            title="Открыть форму добавления"
          >
            <span>Добавить</span>
          </div>
        )}
        <div className="panel-content" onClick={(e) => isRightPanelOpen && e.stopPropagation()}>
          <div className="panel-header">
            <h2>Добавить тренировку</h2>
            <button onClick={handleCloseRightPanel} className="close-btn">
              ×
            </button>
          </div>
          <div className="panel-body">
            <AddWorkoutForm templates={recentWorkouts} />
          </div>
        </div>
      </aside>
    </div>
  )
}
