'use client'

import React from 'react'

/* Порядок сверху вниз: шея → плечи → грудь → бицепс → предплечье → талия → бёдра → бедро → голень. Равные интервалы. */
const ZONES: { key: string; label: string; yPercent: number }[] = [
  { key: 'neck', label: 'Шея', yPercent: 10 },
  { key: 'shoulders', label: 'Плечи', yPercent: 20 },
  { key: 'chest', label: 'Грудь', yPercent: 30 },
  { key: 'biceps', label: 'Бицепс', yPercent: 40 },
  { key: 'forearm', label: 'Предплечье', yPercent: 50 },
  { key: 'waist', label: 'Талия', yPercent: 60 },
  { key: 'hips', label: 'Бёдра', yPercent: 70 },
  { key: 'thigh', label: 'Бедро', yPercent: 80 },
  { key: 'calf', label: 'Голень', yPercent: 90 },
]

interface MeasurementStripsOverlayProps {
  measurements: Record<string, number | null | undefined>
}

export default function MeasurementStripsOverlay({
  measurements,
}: MeasurementStripsOverlayProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1]"
      aria-hidden
    >
      {ZONES.map((zone) => {
        const value = measurements[zone.key]
        if (value == null) return null
        return (
          <div
            key={zone.key}
            className="absolute left-0 right-0 flex items-center justify-end px-3"
            style={{ top: `${zone.yPercent}%`, transform: 'translateY(-50%)' }}
          >
            <div className="absolute left-0 right-0 h-px border-t border-dashed border-emerald-400/60" />
            <span className="relative z-10 text-xs font-medium text-emerald-300/95 shrink-0 bg-[rgb(12,18,14)]/80 px-2 py-0.5 rounded">
              {zone.label}: {value} см
            </span>
          </div>
        )
      })}
    </div>
  )
}
