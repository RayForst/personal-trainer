'use client'

import React from 'react'
import ExerciseChart from '../../components/ExerciseChart'
import type { Workout } from '@/payload-types'

interface ProgressPageProps {
  initialWorkouts: Workout[]
}

export default function ProgressPage({ initialWorkouts }: ProgressPageProps) {
  return (
    <div className="triptych-container">
      <main className="center-content">
        {/* График прогресса упражнений */}
        <ExerciseChart workouts={initialWorkouts} />
      </main>
    </div>
  )
}
