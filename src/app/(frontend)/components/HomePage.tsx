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
    <div className="triptych-container relative flex w-full h-[calc(100vh-var(--header-height))] mt-[var(--header-height)] overflow-hidden">
      {/* Центральная часть - История и статистика */}
      <main className="center-content flex-1 flex flex-col gap-6 p-6 overflow-y-auto min-w-0 w-full transition-[margin] duration-300 ease-in-out">
        {/* Сетка активности и тренировки за день: при выборе дня — две колонки 50/50 с плавной анимацией */}
        <section
          className={`bg-white rounded-xl p-8 shadow-sm flex flex-col md:flex-row gap-4 items-stretch min-h-0 overflow-hidden ${selectedDate ? 'md:max-h-[calc(100vh-var(--header-height)-180px)]' : ''}`}
        >
          <div
            className={`min-w-0 flex flex-col overflow-y-auto shrink-0 transition-[flex-basis] duration-300 ease-out ${selectedDate ? 'basis-full md:basis-1/2' : 'basis-full'}`}
          >
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4 shrink-0">
              <h2 className="m-0">История тренировок</h2>
              <div className="flex gap-4 items-center">
                <button
                  onClick={handleAddWorkoutClick}
                  className="border border-green-600 text-green-600 px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-green-600 hover:text-white"
                >
                  ДОБАВИТЬ
                </button>
              </div>
            </div>
            <WorkoutGrid workouts={allWorkouts} onDaySelect={handleDaySelect} />
          </div>

          <div
            className={`min-w-0 overflow-hidden flex flex-col transition-[flex-basis] duration-300 ease-out ${selectedDate ? 'basis-full md:basis-1/2' : 'basis-0'}`}
          >
            {selectedDate && (
              <div className="border border-gray-200 border-b-0 rounded-t-lg bg-white overflow-hidden flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between gap-4 py-3 px-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="m-0 text-base font-semibold text-gray-900">
                    Тренировки за день{' '}
                    <span className="text-sm text-gray-500 font-normal">
                      ({formatDate(selectedDate)})
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleCloseDayDetail}
                    className="py-1.5 px-3 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-md cursor-pointer transition-colors hover:bg-gray-100 hover:border-gray-400"
                  >
                    ЗАКРЫТЬ
                  </button>
                </div>
                {selectedDateWorkouts.length > 0 ? (
                  <div className="p-4 flex-1 min-h-0 overflow-y-auto max-h-none">
                    <WorkoutList
                      initialWorkouts={selectedDateWorkouts}
                      onWorkoutUpdate={handleWorkoutUpdate}
                      onWorkoutDelete={handleWorkoutDelete}
                      onWorkoutCopy={handleWorkoutCopy}
                    />
                  </div>
                ) : (
                  <div className="p-4 text-gray-500 text-[0.95rem] flex-1 min-h-0 overflow-y-auto max-h-none">
                    <p className="m-0">В этот день тренировок не было</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Статистика дня */}
        <WorkoutStats workouts={selectedDateWorkouts} selectedDate={selectedDate} />
      </main>

      {/* Модалка Добавить тренировку */}
      {isAddModalOpen && (
        <div
          className="add-workout-modal-overlay fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center p-4"
          onClick={handleCloseAddModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-workout-modal-title"
        >
          <div
            className="add-workout-modal bg-white rounded-xl shadow-2xl w-full max-w-[1080px] max-h-[calc(100vh-2rem)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center py-5 px-6 border-b border-gray-200 shrink-0">
              <h2 id="add-workout-modal-title" className="m-0 text-xl text-gray-800">
                Добавить тренировку
              </h2>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="bg-transparent border-none text-2xl leading-none text-gray-500 cursor-pointer p-1 -m-1 rounded hover:bg-gray-100 hover:text-gray-800 transition-colors"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 min-h-0">
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
