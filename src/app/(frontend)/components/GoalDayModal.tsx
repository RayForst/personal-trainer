'use client'

import React, { useState, useEffect } from 'react'
import type { Goal } from '@/payload-types'
import { showToast } from '@/lib/toast'
import { confirmAction } from './ConfirmDialog'

interface GoalDayModalProps {
  goal: Goal | null
  date: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function GoalDayModal({
  goal,
  date,
  isOpen,
  onClose,
  onUpdate,
}: GoalDayModalProps) {
  const [formData, setFormData] = useState({
    value: '',
  })
  const [activityRecordId, setActivityRecordId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (goal && date && isOpen) {
      // Загружаем существующую запись активности для этой цели и даты
      const fetchExistingRecord = async () => {
        try {
          const response = await fetch(`/api/goal-activity-records?date=${date}&goalId=${goal.id}`)
          if (response.ok) {
            const data = await response.json()
            const record = data.docs && data.docs[0]
            
            if (record) {
              setFormData({
                value: record.value?.toString() || '',
              })
              setActivityRecordId(record.id)
            } else {
              setFormData({
                value: '',
              })
              setActivityRecordId(null)
            }
          }
        } catch (error) {
          console.error('Error fetching existing record:', error)
          setFormData({
            value: '',
          })
          setActivityRecordId(null)
        }
      }

      fetchExistingRecord()
    }
  }, [goal, date, isOpen])

  if (!isOpen || !goal || !date) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
      // КРИТИЧНО: При создании новой записи передаем goalId
      // При обновлении НЕ передаем goalId - он уже установлен в записи и не должен изменяться
      if (!activityRecordId) {
        formDataToSend.append('goalId', goal.id)
      }
      formDataToSend.append('date', date)
      formDataToSend.append('value', formData.value)

      // ВАЖНО: Используем ТОЛЬКО API для активностей, НИКОГДА не трогаем /api/goals
      const url = activityRecordId
        ? `/api/goal-activity-records/${activityRecordId}`
        : '/api/goal-activity-records'
      const method = activityRecordId ? 'PUT' : 'POST'

      console.log('Submitting activity record:', {
        method,
        url,
        goalId: goal.id,
        date,
        value: formData.value,
        activityRecordId,
      })

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      })

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        showToast.success('Активность по цели сохранена!')
        onUpdate()
        onClose()
      } else {
        showToast.error('Ошибка при сохранении активности')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast.error('Ошибка при сохранении активности')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!activityRecordId) {
      showToast.error('Запись активности не найдена')
      return
    }

    const confirmed = await confirmAction('Вы уверены, что хотите удалить эту запись активности?')
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/goal-activity-records/${activityRecordId}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        showToast.success('Запись активности удалена!')
        onUpdate()
        onClose()
      } else {
        showToast.error('Ошибка при удалении записи')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast.error('Ошибка при удалении записи')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {goal.name} - {formatDate(date)}
          </h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="goal-day-value">
              Значение ({goal.unit && goal.unit.toLowerCase().trim() !== 'секунд' ? goal.unit : ''}):
            </label>
            <input
              type="number"
              id="goal-day-value"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
              required
              autoFocus
            />
            <small className="form-help">
              Введите значение для {formatDate(date)}
            </small>
          </div>

          <div className="modal-actions">
            {activityRecordId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="delete-btn"
              >
                {isDeleting ? 'Удаление...' : 'Удалить запись'}
              </button>
            )}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" onClick={onClose} className="cancel-btn">
                Отмена
              </button>
              <button type="submit" disabled={isSubmitting} className="submit-btn">
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
