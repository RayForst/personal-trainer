'use client'

import React, { useState, useEffect } from 'react'
import type { Goal } from '@/payload-types'
import { showToast } from '@/lib/toast'
import { confirmAction } from './ConfirmDialog'

interface EditGoalModalProps {
  goal: Goal | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function EditGoalModal({ goal, isOpen, onClose, onUpdate }: EditGoalModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    endDate: '',
    unit: '',
    notes: '',
    image: null as File | null,
  })
  const [activityValue, setActivityValue] = useState('')
  const [activityRecordId, setActivityRecordId] = useState<string | null>(null)
  const [activityDate, setActivityDate] = useState<string>('')
  const [removeImage, setRemoveImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (goal) {
      // Загружаем полные данные цели, включая endDate
      const loadFullGoal = async () => {
        try {
          const response = await fetch(`/api/goals`)
          if (response.ok) {
            const data = await response.json()
            const fullGoal = data.docs.find((g: Goal) => g.id === goal.id)
            if (fullGoal) {
              setFormData({
                name: fullGoal.name || '',
                date: fullGoal.date ? fullGoal.date.split('T')[0] : '',
                endDate: fullGoal.endDate ? fullGoal.endDate.split('T')[0] : '',
                unit: fullGoal.unit || '',
                notes: fullGoal.notes || '',
                image: null,
              })

              const imageUrl =
                fullGoal.image &&
                typeof fullGoal.image === 'object' &&
                fullGoal.image !== null &&
                'url' in fullGoal.image
                  ? (fullGoal.image.url as string)
                  : null
              setCurrentImageUrl(imageUrl || null)
              return
            }
          }
        } catch (error) {
          console.error('Error loading full goal:', error)
        }

        // Fallback: используем данные из пропса
        setFormData({
          name: goal.name || '',
          date: goal.date ? goal.date.split('T')[0] : '',
          endDate: goal.endDate ? goal.endDate.split('T')[0] : '',
          unit: goal.unit || '',
          notes: goal.notes || '',
          image: null,
        })

        const imageUrl =
          goal.image && typeof goal.image === 'object' && goal.image !== null && 'url' in goal.image
            ? (goal.image.url as string)
            : null
        setCurrentImageUrl(imageUrl || null)
      }

      loadFullGoal()

      // Загружаем последнюю активность для этой цели
      const loadLatestActivity = async () => {
        try {
          const response = await fetch(`/api/goal-activity-records?goalId=${goal.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.docs && data.docs.length > 0) {
              // Сортируем по дате и берем последнюю
              const sorted = data.docs.sort(
                (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
              )
              const latestActivity = sorted[0]
              setActivityValue(latestActivity.value?.toString() || '')
              setActivityRecordId(latestActivity.id)
              setActivityDate(latestActivity.date ? latestActivity.date.split('T')[0] : '')
            } else {
              setActivityValue('')
              setActivityRecordId(null)
              setActivityDate(new Date().toISOString().split('T')[0])
            }
          }
        } catch (error) {
          console.error('Error loading activity:', error)
          setActivityValue('')
          setActivityRecordId(null)
          setActivityDate(new Date().toISOString().split('T')[0])
        }
      }

      loadLatestActivity()
      setRemoveImage(false)
    }
  }, [goal])

  if (!isOpen || !goal) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Обновляем метаданные цели
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('date', formData.date)
      formDataToSend.append('endDate', formData.endDate || '')
      formDataToSend.append('unit', formData.unit)
      formDataToSend.append('notes', formData.notes)
      formDataToSend.append('removeImage', removeImage.toString())

      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      const goalResponse = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        body: formDataToSend,
      })

      if (goalResponse.status === 401) {
        window.location.href = '/login'
        return
      }

      // Обновляем или создаем запись активности
      if (activityValue && activityDate) {
        const activityFormData = new FormData()
        if (!activityRecordId) {
          activityFormData.append('goalId', goal.id)
        }
        activityFormData.append('date', activityDate)
        activityFormData.append('value', activityValue)

        const activityUrl = activityRecordId
          ? `/api/goal-activity-records/${activityRecordId}`
          : '/api/goal-activity-records'
        const activityMethod = activityRecordId ? 'PUT' : 'POST'

        const activityResponse = await fetch(activityUrl, {
          method: activityMethod,
          body: activityFormData,
        })

        if (activityResponse.status === 401) {
          window.location.href = '/login'
          return
        }

        if (!activityResponse.ok) {
          showToast.error('Ошибка при обновлении активности')
          setIsSubmitting(false)
          return
        }
      }

      if (goalResponse.ok) {
        showToast.success('Цель успешно обновлена!')
        onUpdate()
        onClose()
      } else {
        showToast.error('Ошибка при обновлении цели')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast.error('Ошибка при обновлении цели')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirmAction('Вы уверены, что хотите удалить эту цель?')
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        showToast.success('Цель успешно удалена!')
        onUpdate()
        onClose()
      } else {
        showToast.error('Ошибка при удалении цели')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast.error('Ошибка при удалении цели')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, image: file }))
    setRemoveImage(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактировать цель</h2>
          <button onClick={onClose} className="close-btn">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-goal-name">Название цели:</label>
            <input
              type="text"
              id="edit-goal-name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-goal-date">Дата:</label>
            <input
              type="date"
              id="edit-goal-date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-goal-end-date">Дата завершения (опционально):</label>
            <input
              type="date"
              id="edit-goal-end-date"
              value={formData.endDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
              min={formData.date}
            />
            <small className="form-help">Дата, когда цель была завершена</small>
          </div>

          <div className="form-group">
            <label htmlFor="edit-goal-unit">Единица измерения (опционально):</label>
            <input
              type="text"
              id="edit-goal-unit"
              value={formData.unit}
              onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-activity-value">Последнее значение активности:</label>
            <input
              type="number"
              id="edit-activity-value"
              step="0.01"
              value={activityValue}
              onChange={(e) => setActivityValue(e.target.value)}
              placeholder="Введите значение"
            />
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              style={{ marginTop: '0.5rem', width: '100%' }}
            />
            <small className="form-help">
              Значение активности за указанную дату. Это НЕ изменяет глобальную цель, только запись
              активности.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="edit-goal-notes">Заметки:</label>
            <textarea
              id="edit-goal-notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Изображение для фона:</label>
            {currentImageUrl && !removeImage && (
              <div style={{ marginBottom: '0.5rem' }}>
                <img
                  src={currentImageUrl}
                  alt="Текущее изображение"
                  style={{
                    maxWidth: '200px',
                    maxHeight: '150px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setRemoveImage(true)}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Удалить изображение
                </button>
              </div>
            )}
            <input type="file" id="edit-goal-image" accept="image/*" onChange={handleImageChange} />
            <small className="form-help">
              Оставьте пустым, чтобы сохранить текущее изображение
            </small>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="delete-btn"
            >
              {isDeleting ? 'Удаление...' : 'Удалить цель'}
            </button>
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
