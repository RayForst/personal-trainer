'use client'

import React, { useState } from 'react'
import type { Workout } from '@/payload-types'
import EditableWorkoutCard from './EditableWorkoutCard'

interface WorkoutListProps {
  initialWorkouts: Workout[]
  onWorkoutUpdate?: (updatedWorkout: Workout) => void
  onWorkoutDelete?: (workoutId: string) => void
}

export default function WorkoutList({
  initialWorkouts,
  onWorkoutUpdate,
  onWorkoutDelete,
}: WorkoutListProps) {
  const [workouts, setWorkouts] = useState(initialWorkouts)

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
      <div className="no-workouts">
        <p>В этот день тренировок не было</p>
        <a href="/" className="add-workout-link">
          Добавить тренировку
        </a>
      </div>
    )
  }

  return (
    <div className="workouts-list">
      {workouts.map((workout) => (
        <EditableWorkoutCard
          key={workout.id}
          workout={workout}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  )
}
