'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Workout } from '@/payload-types'
import EditableWorkoutCard from './EditableWorkoutCard'

interface WorkoutListProps {
  initialWorkouts: Workout[]
  onWorkoutUpdate?: (updatedWorkout: Workout) => void
  onWorkoutDelete?: (workoutId: string) => void
  onWorkoutCopy?: (newWorkout: Workout) => void
}

export default function WorkoutList({
  initialWorkouts,
  onWorkoutUpdate,
  onWorkoutDelete,
  onWorkoutCopy,
}: WorkoutListProps) {
  const [workouts, setWorkouts] = useState(initialWorkouts)

  // Синхронизируем состояние с новыми initialWorkouts
  useEffect(() => {
    setWorkouts(initialWorkouts)
  }, [initialWorkouts])

  const handleDelete = (workoutId: string) => {
    setWorkouts(workouts.filter((workout) => workout.id !== workoutId))
    onWorkoutDelete?.(workoutId)
  }

  const handleUpdate = (workoutId: string, updatedWorkout: Workout) => {
    setWorkouts(workouts.map((workout) => (workout.id === workoutId ? updatedWorkout : workout)))
    onWorkoutUpdate?.(updatedWorkout)
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <p className="text-lg text-gray-500 mb-6 m-0">В этот день тренировок не было</p>
        <Link
          href="/"
          className="inline-block py-3 px-6 bg-blue-600 text-white no-underline rounded-lg font-medium transition-colors hover:bg-blue-700"
        >
          Добавить тренировку
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {workouts.map((workout) => (
        <EditableWorkoutCard
          key={workout.id}
          workout={workout}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onCopy={onWorkoutCopy}
        />
      ))}
    </div>
  )
}
