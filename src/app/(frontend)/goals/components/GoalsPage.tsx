'use client'

import React from 'react'
import GoalsList from '../../components/GoalsList'

export default function GoalsPage() {
  return (
    <div className="triptych-container">
      <main className="center-content">
        {/* Список целей */}
        <GoalsList />
      </main>
    </div>
  )
}
