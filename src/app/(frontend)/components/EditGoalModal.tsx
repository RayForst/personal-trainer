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

  const formGroup = 'flex flex-col gap-2'
  const formLabel = 'font-semibold text-gray-600 text-sm'
  const formInput =
    'py-3 px-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]'

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0">
          <h2 className="m-0 text-gray-800 text-2xl">Редактировать цель</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-600 text-white border-none cursor-pointer flex items-center justify-center text-xl leading-none transition-colors hover:bg-red-700 shrink-0"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className={formGroup}>
            <label htmlFor="edit-goal-name" className={formLabel}>Название цели:</label>
            <input
              type="text"
              id="edit-goal-name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className={formInput}
              required
            />
          </div>

          <div className={formGroup}>
            <label htmlFor="edit-goal-date" className={formLabel}>Дата:</label>
            <input
              type="date"
              id="edit-goal-date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className={formInput}
              required
            />
          </div>

          <div className={formGroup}>
            <label htmlFor="edit-goal-end-date" className={formLabel}>Дата завершения (опционально):</label>
            <input
              type="date"
              id="edit-goal-end-date"
              value={formData.endDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
              min={formData.date}
              className={formInput}
            />
            <small className="block mt-1 text-sm text-gray-500 italic">Дата, когда цель была завершена</small>
          </div>

          <div className={formGroup}>
            <label htmlFor="edit-goal-unit" className={formLabel}>Единица измерения (опционально):</label>
            <input
              type="text"
              id="edit-goal-unit"
              value={formData.unit}
              onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
              className={formInput}
            />
          </div>

          <div className={formGroup}>
            <label htmlFor="edit-activity-value" className={formLabel}>Последнее значение активности:</label>
            <input
              type="number"
              id="edit-activity-value"
              step="0.01"
              value={activityValue}
              onChange={(e) => setActivityValue(e.target.value)}
              placeholder="Введите значение"
              className={formInput}
            />
            <input
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className={`${formInput} mt-2 w-full`}
            />
            <small className="block mt-1 text-sm text-gray-500 italic">
              Значение активности за указанную дату. Это НЕ изменяет глобальную цель, только запись
              активности.
            </small>
          </div>

          <div className={formGroup}>
            <label htmlFor="edit-goal-notes" className={formLabel}>Заметки:</label>
            <textarea
              id="edit-goal-notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className={formInput}
            />
          </div>

          <div className={formGroup}>
            <label className={formLabel}>Изображение для фона:</label>
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
            <small className="block mt-1 text-sm text-gray-500 italic">
              Оставьте пустым, чтобы сохранить текущее изображение
            </small>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="py-3 px-6 bg-red-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Удаление...' : 'Удалить цель'}
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-6 bg-gray-500 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-gray-600"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-6 bg-blue-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
