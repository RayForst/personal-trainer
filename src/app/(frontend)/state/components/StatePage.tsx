'use client'

import React, { useState } from 'react'
import BodyMeasurementsSection from './BodyMeasurementsSection'

export default function StatePage() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])

  return (
    <div className="triptych-container relative flex w-full h-[calc(100vh-var(--header-height))] mt-[var(--header-height)] overflow-hidden">
      <main className="center-content flex-1 flex flex-col gap-6 p-6 overflow-y-auto min-w-0 w-full transition-[margin] duration-300 ease-in-out">
        <section className="bg-white rounded-xl p-6 shadow-sm w-full max-w-none">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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

          <BodyMeasurementsSection date={date} />
        </section>
      </main>
    </div>
  )
}
