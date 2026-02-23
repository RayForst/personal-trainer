'use client'

import React, { useEffect, useState } from 'react'
import chestCoordinates from './muscleZones/chest'
import BodyControls from './BodyControls'
import MeasurementStripsOverlay from './MeasurementStripsOverlay'
import { useModelLoader } from './useModelLoader'
import { useMuscleHighlighting } from './useMuscleHighlighting'
import ModelRenderer from './ModelRenderer'

interface Body3DModelProps {
  date?: string
}

export default function Body3DModel({ date }: Body3DModelProps) {
  const { model, loading } = useModelLoader('/person18.fbx')
  const { isColoring, isColored, toggleColor } = useMuscleHighlighting(
    model,
    chestCoordinates,
  )
  const [measurements, setMeasurements] = useState<
    Record<string, number | null | undefined>
  >({})

  useEffect(() => {
    if (!date) return
    fetch('/api/body-measurements')
      .then((r) => r.ok ? r.json() : { docs: [] })
      .then((data) => {
        const docs = data.docs || []
        const forDate = docs.find(
          (r: { date: string }) =>
            new Date(r.date).toISOString().split('T')[0] === date,
        )
        if (forDate) {
          setMeasurements({
            neck: forDate.neck,
            shoulders: forDate.shoulders,
            chest: forDate.chest,
            waist: forDate.waist,
            hips: forDate.hips,
            biceps: forDate.biceps,
            forearm: forDate.forearm,
            thigh: forDate.thigh,
            calf: forDate.calf,
          })
        } else {
          setMeasurements({})
        }
      })
      .catch(() => setMeasurements({}))
  }, [date])

  return (
    <section className="relative body3d-container overflow-hidden h-full min-h-[400px]">
      {(loading || isColoring) && (
        <div className="absolute right-3 top-3 z-20 text-sm text-emerald-300/90">
          Загрузка…
        </div>
      )}
      <div className="relative h-full min-h-[400px]">
        <MeasurementStripsOverlay measurements={measurements} />
        <div className="absolute inset-0 z-[5]">
          <ModelRenderer model={model} />
        </div>
        <div className="body3d-scanline" aria-hidden />
      </div>
      <BodyControls toggleColor={toggleColor} isColored={isColored} />
    </section>
  )
}
