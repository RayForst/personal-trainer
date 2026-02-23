'use client'

import React, { useEffect, useState } from 'react'
import { showToast } from '@/lib/toast'
import { confirmAction } from '@/app/(frontend)/components/ConfirmDialog'
import BodySilhouette from './BodySilhouette'

const MEASUREMENT_FIELDS = [
  { key: 'neck', label: 'Шея' },
  { key: 'shoulders', label: 'Плечи' },
  { key: 'chest', label: 'Грудь' },
  { key: 'waist', label: 'Талия' },
  { key: 'hips', label: 'Бёдра' },
  { key: 'biceps', label: 'Бицепс' },
  { key: 'forearm', label: 'Предплечье' },
  { key: 'thigh', label: 'Бедро' },
  { key: 'calf', label: 'Голень' },
] as const

const PHOTO_SIDES = [
  { key: 'front', label: 'Спереди' },
  { key: 'back', label: 'Сзади' },
  { key: 'left', label: 'Слева' },
  { key: 'right', label: 'Справа' },
] as const

export interface BodyMeasurementRecord {
  id: string
  date: string
  neck?: number | null
  shoulders?: number | null
  chest?: number | null
  waist?: number | null
  hips?: number | null
  biceps?: number | null
  forearm?: number | null
  thigh?: number | null
  calf?: number | null
  createdAt: string
  updatedAt: string
}

export interface BodyPhotoRecord {
  id: string
  date: string
  front?: { url?: string | null } | string | null
  back?: { url?: string | null } | string | null
  left?: { url?: string | null } | string | null
  right?: { url?: string | null } | string | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getMediaUrl(
  m: { url?: string | null } | string | null | undefined,
): string | null {
  if (m == null) return null
  if (typeof m === 'string') return m
  return m.url ?? null
}

export default function BodyMeasurementsSection() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [measurements, setMeasurements] = useState<Record<string, string>>({})
  const [measurementRecords, setMeasurementRecords] = useState<BodyMeasurementRecord[]>([])
  const [currentMeasurementId, setCurrentMeasurementId] = useState<string | null>(null)
  const [photoRecords, setPhotoRecords] = useState<BodyPhotoRecord[]>([])
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null)
  const [photoFiles, setPhotoFiles] = useState<Record<string, File | null>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submittingPhotos, setSubmittingPhotos] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resM, resP] = await Promise.all([
        fetch('/api/body-measurements'),
        fetch(`/api/body-photos?date=${date}`),
      ])
      if (resM.ok) {
        const data = await resM.json()
        const docs = data.docs || []
        setMeasurementRecords(docs)
        const forDate = docs.find(
          (r: BodyMeasurementRecord) =>
            new Date(r.date).toISOString().split('T')[0] === date,
        )
        if (forDate) {
          setCurrentMeasurementId(forDate.id)
          const vals: Record<string, string> = {}
          for (const f of MEASUREMENT_FIELDS) {
            const v = forDate[f.key]
            vals[f.key] = v != null ? String(v) : ''
          }
          setMeasurements(vals)
        } else {
          setCurrentMeasurementId(null)
          setMeasurements(
            Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, ''])),
          )
        }
      }
      if (resP.ok) {
        const data = await resP.json()
        const docs = data.docs || []
        setPhotoRecords(docs)
        const forDate = docs.find(
          (r: BodyPhotoRecord) =>
            new Date(r.date).toISOString().split('T')[0] === date,
        )
        if (forDate) {
          setCurrentPhotoId(forDate.id)
        } else {
          setCurrentPhotoId(null)
        }
        setPhotoFiles({})
      }
    } catch (e) {
      console.error(e)
      showToast.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [date])

  const handleMeasurementChange = (key: string, value: string) => {
    setMeasurements((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault()
    const data: Record<string, number> = {}
    for (const f of MEASUREMENT_FIELDS) {
      const v = parseFloat(measurements[f.key]?.replace(',', '.') ?? '')
      if (!Number.isNaN(v) && v >= 1 && v <= 300) {
        data[f.key] = Math.round(v * 10) / 10
      }
    }
    if (Object.keys(data).length === 0 && !currentMeasurementId) {
      showToast.error('Введите хотя бы одно измерение')
      return
    }
    setSubmitting(true)
    try {
      if (currentMeasurementId) {
        const res = await fetch(`/api/body-measurements/${currentMeasurementId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, ...data }),
        })
        const updated = await res.json()
        if (res.ok) {
          showToast.success('Измерения обновлены')
          setMeasurementRecords((prev) =>
            prev.map((r) => (r.id === currentMeasurementId ? updated : r)),
          )
        } else {
          showToast.error(updated.error || 'Ошибка сохранения')
        }
      } else {
        const res = await fetch('/api/body-measurements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, ...data }),
        })
        const created = await res.json()
        if (res.ok) {
          showToast.success('Измерения сохранены')
          setCurrentMeasurementId(created.id)
          setMeasurementRecords((prev) => [created, ...prev])
        } else {
          showToast.error(created.error || 'Ошибка сохранения')
        }
      }
    } catch (e) {
      showToast.error('Ошибка сохранения')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePhotoFileChange = (key: string, file: File | null) => {
    setPhotoFiles((prev) => ({ ...prev, [key]: file }))
  }

  const handleSavePhotos = async (e: React.FormEvent) => {
    e.preventDefault()
    const hasFiles = Object.values(photoFiles).some((f) => f != null)
    if (!hasFiles && !currentPhotoId) {
      showToast.error('Загрузите хотя бы одно фото')
      return
    }
    setSubmittingPhotos(true)
    try {
      const formData = new FormData()
      formData.set('date', date)
      for (const { key } of PHOTO_SIDES) {
        const f = photoFiles[key]
        if (f) formData.set(key, f)
      }
      if (currentPhotoId) {
        const res = await fetch(`/api/body-photos/${currentPhotoId}`, {
          method: 'PUT',
          body: formData,
        })
        const updated = await res.json()
        if (res.ok) {
          showToast.success('Фото обновлены')
          setPhotoRecords((prev) =>
            prev.map((r) => (r.id === currentPhotoId ? updated : r)),
          )
          setCurrentPhotoId(updated.id)
          setPhotoFiles({})
        } else {
          showToast.error(updated.error || 'Ошибка сохранения')
        }
      } else {
        const res = await fetch('/api/body-photos', {
          method: 'POST',
          body: formData,
        })
        const created = await res.json()
        if (res.ok) {
          showToast.success('Фото сохранены')
          setCurrentPhotoId(created.id)
          setPhotoRecords((prev) => [created, ...prev])
          setPhotoFiles({})
        } else {
          showToast.error(created.error || 'Ошибка сохранения')
        }
      }
    } catch (e) {
      showToast.error('Ошибка сохранения')
    } finally {
      setSubmittingPhotos(false)
    }
  }

  const currentRecord = measurementRecords.find(
    (r) => new Date(r.date).toISOString().split('T')[0] === date,
  )
  const currentPhotoRecord = photoRecords.find(
    (r) => new Date(r.date).toISOString().split('T')[0] === date,
  )

  const measurementValues: Record<string, number> = {}
  for (const f of MEASUREMENT_FIELDS) {
    const v = currentRecord?.[f.key] ?? parseFloat(measurements[f.key]?.replace(',', '.') ?? '')
    if (typeof v === 'number' && !Number.isNaN(v)) {
      measurementValues[f.key] = v
    }
  }

  const inputCls =
    'py-2 px-3 border border-gray-200 rounded-md text-base min-w-[80px] w-24'

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <label htmlFor="body-date" className="text-sm font-medium text-gray-600">
          Дата
        </label>
        <input
          id="body-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="m-0 mb-4 text-base font-semibold text-gray-800">
                Фото (4 ракурса)
              </h3>
          <form onSubmit={handleSavePhotos} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {PHOTO_SIDES.map(({ key, label }) => {
                const existing = currentPhotoRecord
                  ? getMediaUrl(
                      currentPhotoRecord[key as keyof BodyPhotoRecord] ?? null,
                    )
                  : null
                const file = photoFiles[key]
                const preview = file
                  ? URL.createObjectURL(file)
                  : existing
                  ? (existing.startsWith('http') ? existing : `${typeof window !== 'undefined' ? window.location.origin : ''}${existing}`)
                  : null
                return (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">
                      {label}
                    </label>
                    <div className="relative aspect-[3/4] max-h-40 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                      {preview ? (
                        <img
                          src={preview}
                          alt={label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          +
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          handlePhotoFileChange(key, f ?? null)
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <button
              type="submit"
              className="py-2 px-5 bg-blue-600 text-white border-none rounded-md font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed w-fit"
              disabled={submittingPhotos}
            >
              {submittingPhotos ? 'Сохранение…' : 'Сохранить фото'}
            </button>
          </form>
        </div>

        <div>
          <h3 className="m-0 mb-4 text-base font-semibold text-gray-800">
            Измерения (см)
          </h3>
          <form onSubmit={handleSaveMeasurements} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {MEASUREMENT_FIELDS.map(({ key, label }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label
                    htmlFor={`meas-${key}`}
                    className="text-sm font-medium text-gray-600"
                  >
                    {label}
                  </label>
                  <input
                    id={`meas-${key}`}
                    type="number"
                    step="0.1"
                    min="1"
                    max="300"
                    placeholder="—"
                    value={measurements[key] ?? ''}
                    onChange={(e) => handleMeasurementChange(key, e.target.value)}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
            <button
              type="submit"
              className="py-2 px-5 bg-blue-600 text-white border-none rounded-md font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed w-fit"
              disabled={submitting}
            >
              {submitting ? 'Сохранение…' : 'Сохранить измерения'}
            </button>
          </form>
        </div>
          </div>
        </div>

        <div className="lg:w-[320px] xl:w-[400px] shrink-0 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:self-start">
          <h3 className="m-0 mb-4 text-base font-semibold text-gray-800">
            Визуализация
          </h3>
          <BodySilhouette measurements={measurementValues} />
        </div>
      </div>

      {!loading && measurementRecords.length > 0 && (
        <div>
          <h3 className="m-0 mb-4 text-base font-semibold text-gray-600">
            История измерений
          </h3>
          <table className="w-full border-collapse [&_th]:py-2.5 [&_th]:px-3 [&_th]:text-left [&_th]:border-b [&_th]:border-gray-200 [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:text-sm [&_td]:py-2.5 [&_td]:px-3 [&_td]:border-b [&_td]:border-gray-200">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Талия</th>
                <th>Грудь</th>
                <th>Бёдра</th>
                <th>Бицепс</th>
              </tr>
            </thead>
            <tbody>
              {measurementRecords.slice(0, 10).map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.waist ?? '—'}</td>
                  <td>{r.chest ?? '—'}</td>
                  <td>{r.hips ?? '—'}</td>
                  <td>{r.biceps ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
