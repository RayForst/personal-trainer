'use client'

import React, { useState } from 'react'
import BodyMeasurementsSection from './BodyMeasurementsSection'
import Body3DModel from './Body3D/Body3DModel'

export default function StatePage() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])

  return (
    <div className="triptych-container relative flex w-full h-[calc(100vh-var(--header-height))] mt-[var(--header-height)] overflow-hidden">
      <main className="center-content flex-1 flex gap-6 p-6 min-w-0 w-full overflow-hidden">
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
    </div>
  )
}
