'use client'

import React from 'react'
import GoalsList from '../../components/GoalsList'

export default function GoalsPage() {
  return (
    <div className="triptych-container relative flex w-full h-[calc(100vh-var(--header-height))] mt-[var(--header-height)] overflow-hidden">
      <main className="center-content flex-1 flex flex-col gap-6 p-6 overflow-y-auto min-w-0 w-full transition-[margin] duration-300 ease-in-out">
        {/* Список целей */}
        <GoalsList />
      </main>
    </div>
  )
}
