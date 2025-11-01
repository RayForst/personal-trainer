'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import WorkoutGrid from './WorkoutGrid'
import AddWorkoutForm from './AddWorkoutForm'
import WorkoutList from '../workout/[date]/components/WorkoutList'
import WorkoutStats from './WorkoutStats'
import GoalsList from './GoalsList'
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
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false)
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
    setIsLeftPanelOpen(true)

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

  const handleCloseLeftPanel = () => {
    setIsLeftPanelOpen(false)
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
      className={`triptych-container ${isLeftPanelOpen ? 'left-open' : ''} ${isRightPanelOpen ? 'right-open' : ''}`}
    >
      {/* Левая выдвижная панель - Тренировки за день */}
      <aside
        className={`left-panel ${isLeftPanelOpen ? 'open' : ''}`}
        onClick={!isLeftPanelOpen ? () => setIsLeftPanelOpen(true) : undefined}
        title={!isLeftPanelOpen ? 'Открыть тренировки' : undefined}
      >
        {!isLeftPanelOpen && (
          <div
            className="panel-tab"
            onClick={(e) => {
              e.stopPropagation()
              setIsLeftPanelOpen(true)
            }}
            title="Открыть тренировки"
          >
            <span>Тренировки</span>
          </div>
        )}
        <div className="panel-content" onClick={(e) => isLeftPanelOpen && e.stopPropagation()}>
          <div className="panel-header">
            <h2>
              Тренировки за день{' '}
              {selectedDate && <span className="date-info">({formatDate(selectedDate)})</span>}
            </h2>
            <button onClick={handleCloseLeftPanel} className="close-btn">
              ×
            </button>
          </div>
          {selectedDate && selectedDateWorkouts.length > 0 ? (
            <div className="panel-body">
              <WorkoutList
                initialWorkouts={selectedDateWorkouts}
                onWorkoutUpdate={handleWorkoutUpdate}
                onWorkoutDelete={handleWorkoutDelete}
              />
            </div>
          ) : selectedDate ? (
            <div className="panel-body placeholder-content">
              <p>В этот день тренировок не было</p>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Центральная часть - История и статистика */}
      <main className="center-content">
        {/* Сетка активности */}
        <section className="activity-section">
          <div className="activity-header">
            <h2>
              История тренировок<sup>Последний год активности</sup>
            </h2>
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
