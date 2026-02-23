'use client'

import React, { useState } from 'react'

export interface BodySilhouetteMeasurements {
  neck?: number
  shoulders?: number
  chest?: number
  waist?: number
  hips?: number
  biceps?: number
  forearm?: number
  thigh?: number
  calf?: number
}

const ZONES_FRONT: { key: keyof BodySilhouetteMeasurements; label: string; yPercent: number }[] = [
  { key: 'shoulders', label: 'Плечи', yPercent: 14 },
  { key: 'chest', label: 'Грудь', yPercent: 26 },
  { key: 'waist', label: 'Талия', yPercent: 40 },
  { key: 'hips', label: 'Бёдра', yPercent: 52 },
]

const ZONES_SIDE: { key: keyof BodySilhouetteMeasurements; label: string; yPercent: number }[] = [
  { key: 'neck', label: 'Шея', yPercent: 8 },
  { key: 'shoulders', label: 'Плечи', yPercent: 14 },
  { key: 'chest', label: 'Грудь', yPercent: 24 },
  { key: 'biceps', label: 'Бицепс', yPercent: 22 },
  { key: 'forearm', label: 'Предплечье', yPercent: 30 },
  { key: 'waist', label: 'Талия', yPercent: 40 },
  { key: 'hips', label: 'Бёдра', yPercent: 50 },
  { key: 'thigh', label: 'Бедро', yPercent: 64 },
  { key: 'calf', label: 'Голень', yPercent: 80 },
]

interface BodySilhouetteProps {
  measurements: BodySilhouetteMeasurements
}

export default function BodySilhouette({ measurements }: BodySilhouetteProps) {
  const [view, setView] = useState<'front' | 'side'>('side')
  const zones = view === 'front' ? ZONES_FRONT : ZONES_SIDE

  const w = 200
  const h = 320

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setView('front')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'front'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Анфас
        </button>
        <button
          type="button"
          onClick={() => setView('side')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            view === 'side'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Профиль
        </button>
      </div>

      <div className="relative inline-block bg-gray-50 rounded-lg p-4">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width={w}
          height={h}
          className="block"
        >
          <defs>
            <linearGradient id="silhouetteFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>

          {view === 'front' ? (
            <g>
              <ellipse cx="100" cy="28" rx="22" ry="26" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
              <path d="M78 54 L78 100 L122 100 L122 54 C122 42 112 54 100 54 C88 54 78 42 78 54 Z" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
              <path d="M85 100 L85 150 L95 150 L95 100 M105 100 L105 150 L115 150 L115 100" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
              <path d="M95 152 L95 308 L105 308 L105 152" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
              <path d="M88 308 L88 318 L112 318 L112 308" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
            </g>
          ) : (
            <g>
              <ellipse cx="100" cy="28" rx="18" ry="22" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
              <path d="M82 50 L82 100 L118 100 L118 50 C118 40 110 50 100 50 C90 50 82 40 82 50 Z" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
              <path d="M95 100 L95 155 L105 155 L105 100" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
              <path d="M98 157 L98 308 L102 308 L102 157" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
              <path d="M96 308 L96 318 L104 318 L104 308" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
              <path d="M82 65 Q70 70 68 85 Q66 95 75 92 L90 88" fill="url(#silhouetteFill)" stroke="#9ca3af" strokeWidth="1" />
            </g>
          )}

          {zones.map((zone) => {
            const value = measurements[zone.key]
            if (value == null) return null
            const y = (zone.yPercent / 100) * h
            return (
              <g key={zone.key}>
                <line
                  x1={0}
                  y1={y}
                  x2={w}
                  y2={y}
                  stroke="#2563eb"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                <text
                  x={view === 'front' ? w / 2 : w - 8}
                  y={y - 4}
                  textAnchor={view === 'front' ? 'middle' : 'end'}
                  fontSize="11"
                  fill="#1d4ed8"
                  fontWeight="600"
                >
                  {zone.label}: {value} см
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
