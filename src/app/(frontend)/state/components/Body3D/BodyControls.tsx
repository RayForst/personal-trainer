'use client'

import React from 'react'

interface BodyControlsProps {
  toggleColor: () => void
  isColored: boolean
}

export default function BodyControls({ toggleColor, isColored }: BodyControlsProps) {
  return (
    <div className="absolute bottom-3 right-3 z-10">
      <button
        type="button"
        onClick={toggleColor}
        className="py-1.5 px-3 text-xs font-medium rounded border border-emerald-400/50 bg-emerald-600/90 text-emerald-950 hover:bg-emerald-500/90 transition-colors"
      >
        {isColored ? 'Убрать подсветку' : 'Подсветить мышцы'}
      </button>
    </div>
  )
}
