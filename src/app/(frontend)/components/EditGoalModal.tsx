'use client'

import React, { useState, useEffect } from 'react'
import type { Goal } from '@/payload-types'

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
    value: '',
    unit: '',
    notes: '',
    image: null as File | null,
  })
  const [removeImage, setRemoveImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (goal) {
      setFormData({
        name: goal.name || '',
        date: goal.date ? goal.date.split('T')[0] : '',
        value: goal.value?.toString() || '',
        unit: goal.unit || '',
        notes: goal.notes || '',
        image: null,
      })
      setRemoveImage(false)
      
      // Получаем URL текущего изображения
      const imageUrl =
        goal.image &&
        typeof goal.image === 'object' &&
        goal.image !== null &&
        'url' in goal.image
          ? goal.image.url
          : null
      setCurrentImageUrl(imageUrl)
    }
  }, [goal])

  if (!isOpen || !goal) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('date', formData.date)
      formDataToSend.append('value', formData.value)
      formDataToSend.append('unit', formData.unit)
      formDataToSend.append('notes', formData.notes)
      formDataToSend.append('removeImage', removeImage.toString())

      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      const response = await fetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        body: formDataToSend,
      })

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        alert('Цель успешно обновлена!')
        onUpdate()
        onClose()
      } else {
        alert('Ошибка при обновлении цели')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Ошибка при обновлении цели')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить эту цель?')) {
      return
    }

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
        alert('Цель успешно удалена!')
        onUpdate()
        onClose()
      } else {
        alert('Ошибка при удалении цели')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Ошибка при удалении цели')
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
            <label htmlFor="edit-goal-value">Значение:</label>
            <input
              type="number"
              id="edit-goal-value"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
              required
            />
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
            <input
              type="file"
              id="edit-goal-image"
              accept="image/*"
              onChange={handleImageChange}
            />
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

