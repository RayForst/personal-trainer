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
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0">
          <h2 className="m-0 text-gray-800 text-2xl">
            {goal.name} - {formatDate(date)}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-600 text-white border-none cursor-pointer flex items-center justify-center text-xl leading-none transition-colors hover:bg-red-700 shrink-0"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="goal-day-value" className="font-semibold text-gray-600 text-sm">
              Значение ({goal.unit && goal.unit.toLowerCase().trim() !== 'секунд' ? goal.unit : ''}):
            </label>
            <input
              type="number"
              id="goal-day-value"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
              className="py-3 px-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
              required
              autoFocus
            />
            <small className="block mt-1 text-sm text-gray-500 italic">
              Введите значение для {formatDate(date)}
            </small>
          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            {activityRecordId && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="py-3 px-6 bg-red-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Удаление...' : 'Удалить запись'}
              </button>
            )}
            <div className="flex gap-4 ml-auto">
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
