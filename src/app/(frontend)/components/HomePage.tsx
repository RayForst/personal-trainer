'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import WorkoutGrid from './WorkoutGrid'
import AddWorkoutForm from './AddWorkoutForm'
import WorkoutList from '../workout/[date]/components/WorkoutList'
import WorkoutStats from './WorkoutStats'
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

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
    setIsAddModalOpen(true)
  }

  const handleCloseDayDetail = () => {
    setSelectedDate(null)
    setSelectedDateWorkouts([])
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
  }

  useEffect(() => {
    if (!isAddModalOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCloseAddModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isAddModalOpen])

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

  const handleWorkoutCopy = (newWorkout: Workout) => {
    setAllWorkouts((prev) => [newWorkout, ...prev])
    const newDate = new Date(newWorkout.date).toISOString().split('T')[0]
    if (selectedDate && newDate === selectedDate) {
      setSelectedDateWorkouts((prev) => [newWorkout, ...prev])
    }
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
    <div className="triptych-container">
      {/* Центральная часть - История и статистика */}
      <main className="center-content">
        {/* Сетка активности и тренировки за день: при выборе дня — две колонки 50/50 */}
        <section
          className={`activity-section${selectedDate ? ' activity-section-split' : ''}`}
        >
          <div className="activity-split-left">
            <div className="activity-header">
              <h2 className="mb-0 bg-blue-500 text-white text-[0.5rem] md:bg-transparent md:text-[#2c3e50] md:text-2xl">
                История тренировок
              </h2>
              <div className="header-buttons">
                <button onClick={handleAddWorkoutClick} className="add-workout-btn">
                  ДОБАВИТЬ
                </button>
              </div>
            </div>
            <WorkoutGrid workouts={allWorkouts} onDaySelect={handleDaySelect} />
          </div>

          {selectedDate && (
            <div className="activity-split-right">
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
                      onWorkoutCopy={handleWorkoutCopy}
                    />
                  </div>
                ) : (
                  <div className="day-detail-body day-detail-placeholder">
                    <p>В этот день тренировок не было</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Статистика дня */}
        <WorkoutStats workouts={selectedDateWorkouts} selectedDate={selectedDate} />
      </main>

      {/* Модалка Добавить тренировку */}
      {isAddModalOpen && (
        <div
          className="add-workout-modal-overlay"
          onClick={handleCloseAddModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-workout-modal-title"
        >
          <div className="add-workout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-workout-modal-header">
              <h2 id="add-workout-modal-title">Добавить тренировку</h2>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="add-workout-modal-close"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="add-workout-modal-body">
              <AddWorkoutForm
                templates={recentWorkouts}
                onSuccess={() => {
                  handleCloseAddModal()
                  router.refresh()
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
