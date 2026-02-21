'use client'

import React, { useEffect, useState } from 'react'
import { showToast } from '@/lib/toast'
import { confirmAction } from '@/app/(frontend)/components/ConfirmDialog'

export interface BodyStateRecord {
  id: string
  weight: number
  date: string
  createdAt: string
  updatedAt: string
}

export interface BodyFatRecord {
  id: string
  value: number
  date: string
  createdAt: string
  updatedAt: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function StatePage() {
  const [records, setRecords] = useState<BodyStateRecord[]>([])
  const [fatRecords, setFatRecords] = useState<BodyFatRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(() =>
    new Date().toISOString().split('T')[0],
  )
  const [submitting, setSubmitting] = useState(false)
  const [fatValue, setFatValue] = useState('')
  const [fatDate, setFatDate] = useState(() =>
    new Date().toISOString().split('T')[0],
  )
  const [submittingFat, setSubmittingFat] = useState(false)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const [resState, resFat] = await Promise.all([
        fetch('/api/body-state'),
        fetch('/api/body-fat'),
      ])
      if (resState.ok) {
        const data = await resState.json()
        setRecords(data.docs || [])
      }
      if (resFat.ok) {
        const data = await resFat.json()
        setFatRecords(data.docs || [])
      }
    } catch (e) {
      console.error(e)
      showToast.error('Ошибка загрузки записей')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const w = parseFloat(weight.replace(',', '.'))
    if (Number.isNaN(w) || w <= 0) {
      showToast.error('Введите корректный вес (число больше 0)')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/body-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: w, date }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast.success('Запись добавлена')
        setWeight('')
        setDate(new Date().toISOString().split('T')[0])
        setRecords((prev) => [data, ...prev])
      } else {
        showToast.error(data.error || 'Ошибка сохранения')
      }
    } catch (e) {
      showToast.error('Ошибка сохранения')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmAction('Удалить эту запись?')
    if (!ok) return
    try {
      const res = await fetch(`/api/body-state/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast.success('Запись удалена')
        setRecords((prev) => prev.filter((r) => r.id !== id))
      } else {
        showToast.error('Ошибка удаления')
      }
    } catch (e) {
      showToast.error('Ошибка удаления')
    }
  }

  const handleFatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = parseFloat(fatValue.replace(',', '.'))
    if (Number.isNaN(v) || v < 0 || v > 100) {
      showToast.error('Введите процент от 0 до 100')
      return
    }
    setSubmittingFat(true)
    try {
      const res = await fetch('/api/body-fat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: v, date: fatDate }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast.success('Запись добавлена')
        setFatValue('')
        setFatDate(new Date().toISOString().split('T')[0])
        setFatRecords((prev) => [data, ...prev])
      } else {
        showToast.error(data.error || 'Ошибка сохранения')
      }
    } catch (e) {
      showToast.error('Ошибка сохранения')
    } finally {
      setSubmittingFat(false)
    }
  }

  const handleFatDelete = async (id: string) => {
    const ok = await confirmAction('Удалить эту запись?')
    if (!ok) return
    try {
      const res = await fetch(`/api/body-fat/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast.success('Запись удалена')
        setFatRecords((prev) => prev.filter((r) => r.id !== id))
      } else {
        showToast.error('Ошибка удаления')
      }
    } catch (e) {
      showToast.error('Ошибка удаления')
    }
  }

  return (
    <div className="triptych-container">
      <main className="center-content">
        <section className="state-section">
          <h1>Моё состояние</h1>
          <p className="state-section-desc">
            Отслеживайте вес и процент жира. Каждый показатель — отдельная запись с датой.
          </p>

          <h2 className="state-subsection-title">Вес</h2>
          <form className="state-form" onSubmit={handleSubmit}>
            <div className="state-form-row">
              <label htmlFor="state-weight">Вес (кг)</label>
              <input
                id="state-weight"
                type="number"
                step="0.1"
                min="1"
                max="500"
                placeholder="70.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
            <div className="state-form-row">
              <label htmlFor="state-date">Дата</label>
              <input
                id="state-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="state-submit-btn" disabled={submitting}>
              {submitting ? 'Сохранение…' : 'Добавить запись'}
            </button>
          </form>

          <div className="state-table-wrap">
            <h3 className="state-table-title">История: вес</h3>
            {loading ? (
              <p className="state-loading">Загрузка…</p>
            ) : records.length === 0 ? (
              <p className="state-empty">Пока нет записей. Добавьте первую.</p>
            ) : (
              <table className="state-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>Вес (кг)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.date)}</td>
                      <td>{r.weight}</td>
                      <td>
                        <button
                          type="button"
                          className="state-delete-btn"
                          onClick={() => handleDelete(r.id)}
                          title="Удалить"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <h2 className="state-subsection-title">Процент жира</h2>
          <form className="state-form" onSubmit={handleFatSubmit}>
            <div className="state-form-row">
              <label htmlFor="state-fat-value">Процент жира (%)</label>
              <input
                id="state-fat-value"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="15"
                value={fatValue}
                onChange={(e) => setFatValue(e.target.value)}
                required
              />
            </div>
            <div className="state-form-row">
              <label htmlFor="state-fat-date">Дата</label>
              <input
                id="state-fat-date"
                type="date"
                value={fatDate}
                onChange={(e) => setFatDate(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="state-submit-btn" disabled={submittingFat}>
              {submittingFat ? 'Сохранение…' : 'Добавить запись'}
            </button>
          </form>

          <div className="state-table-wrap">
            <h3 className="state-table-title">История: процент жира</h3>
            {loading ? (
              <p className="state-loading">Загрузка…</p>
            ) : fatRecords.length === 0 ? (
              <p className="state-empty">Пока нет записей. Добавьте первую.</p>
            ) : (
              <table className="state-table">
                <thead>
                  <tr>
                    <th>Дата</th>
                    <th>% жира</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fatRecords.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.date)}</td>
                      <td>{r.value}%</td>
                      <td>
                        <button
                          type="button"
                          className="state-delete-btn"
                          onClick={() => handleFatDelete(r.id)}
                          title="Удалить"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
