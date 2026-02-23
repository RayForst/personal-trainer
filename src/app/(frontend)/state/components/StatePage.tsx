'use client'

import React, { useState } from 'react'
import WeightAndFatSection from './WeightAndFatSection'
import BodyMeasurementsSection from './BodyMeasurementsSection'

export default function StatePage() {
  const [activeTab, setActiveTab] = useState<'weight' | 'body'>('weight')

  const tabBtn =
    'px-5 py-2.5 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-300'
  const tabBtnActive =
    'border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:border-blue-600 hover:text-blue-600'

  return (
    <div className="triptych-container relative flex w-full h-[calc(100vh-var(--header-height))] mt-[var(--header-height)] overflow-hidden">
      <main className="center-content flex-1 flex flex-col gap-6 p-6 overflow-y-auto min-w-0 w-full transition-[margin] duration-300 ease-in-out">
        <section className="bg-white rounded-xl p-6 shadow-sm w-full max-w-none">
          <h1 className="m-0 mb-2 text-2xl text-gray-800">Моё состояние</h1>
          <p className="m-0 mb-6 text-gray-500 text-[0.95rem]">
            Отслеживайте вес, процент жира, обхваты и фото тела.
          </p>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('weight')}
              className={`${tabBtn} ${activeTab === 'weight' ? tabBtnActive : ''}`}
            >
              Вес и жир
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('body')}
              className={`${tabBtn} ${activeTab === 'body' ? tabBtnActive : ''}`}
            >
              Тело и измерения
            </button>
          </div>

          {activeTab === 'weight' && <WeightAndFatSection />}
          {activeTab === 'body' && <BodyMeasurementsSection />}
        </section>
      </main>
    </div>
  )
}
