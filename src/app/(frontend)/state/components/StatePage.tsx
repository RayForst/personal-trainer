'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import BodyMeasurementsSection from './BodyMeasurementsSection'
import Body3DModel from './Body3D/Body3DModel'
import ExerciseChart from '../../components/ExerciseChart'
import ExercisesPage from '../../exercises/components/ExercisesPage'
import type { Workout } from '@/payload-types'

type TabId = 'state' | 'progress' | 'exercises'

const TABS: { id: TabId; label: string }[] = [
  { id: 'state', label: 'Моё состояние' },
  { id: 'progress', label: 'Прогресс' },
  { id: 'exercises', label: 'Упражнения' },
]

export default function StatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabId | null
  const activeTab: TabId =
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'state'

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [workoutsLoading, setWorkoutsLoading] = useState(false)

  const setTab = (tab: TabId) => {
    if (tab === 'state') {
      router.push('/state')
    } else {
      router.push(`/state?tab=${tab}`)
    }
  }

  useEffect(() => {
    if (activeTab === 'progress') {
      setWorkoutsLoading(true)
      fetch('/api/workouts')
        .then((res) => (res.ok ? res.json() : { docs: [] }))
        .then((data) => {
          setWorkouts(data.docs || [])
        })
        .catch(() => setWorkouts([]))
        .finally(() => setWorkoutsLoading(false))
    }
  }, [activeTab])

  const tabBtn =
    'px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2 -mb-px'
  const tabBtnInactive =
    'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
  const tabBtnActive =
    'text-green-600 border-green-600 bg-green-50/50'

  return (
    <div className="triptych-container relative flex flex-col w-full h-[calc(100vh-var(--header-height))] mt-[var(--header-height)] overflow-hidden">
      <div className="shrink-0 flex gap-1 px-6 pt-4 pb-0 bg-white border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`${tabBtn} ${activeTab === tab.id ? tabBtnActive : tabBtnInactive}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'state' && (
          <main className="center-content flex-1 flex gap-6 p-6 min-w-0 w-full h-full overflow-hidden">
            <section className="flex-[8] min-w-0 flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 p-6 pb-0 shrink-0">
                <h1 className="m-0 text-2xl text-gray-800">Моё состояние</h1>
                <div className="flex items-center gap-4">
                  <p className="m-0 text-gray-500 text-[0.95rem] hidden sm:block">
                    Отслеживайте вес, процент жира, обхваты и фото тела.
                  </p>
                  <div className="flex items-center gap-2">
                    <label htmlFor="body-date" className="text-sm font-medium text-gray-600 shrink-0">
                      Дата
                    </label>
                    <input
                      id="body-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[120px]"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 pt-4">
                <BodyMeasurementsSection date={date} />
              </div>
            </section>

            <aside className="flex-[4] min-w-0 flex flex-col h-full shrink-0">
              <div className="h-full rounded-xl overflow-hidden shadow-lg border border-gray-200/80 bg-[rgb(18,27,20)] flex flex-col">
                <h3 className="m-0 py-3 px-4 text-sm font-semibold text-emerald-300/95 bg-[rgb(12,18,14)] border-b border-emerald-500/20 shrink-0">
                  Визуализация
                </h3>
                <div className="flex-1 min-h-0">
                  <Body3DModel date={date} />
                </div>
              </div>
            </aside>
          </main>
        )}

        {activeTab === 'progress' && (
          <main className="center-content flex-1 flex flex-col gap-6 p-6 overflow-y-auto min-w-0 w-full h-full">
            {workoutsLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Загрузка...
              </div>
            ) : (
              <ExerciseChart workouts={workouts} />
            )}
          </main>
        )}

        {activeTab === 'exercises' && (
          <div className="h-full overflow-hidden">
            <ExercisesPage embedded />
          </div>
        )}
      </div>
    </div>
  )
}
