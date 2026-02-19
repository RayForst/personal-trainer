'use client'

import React, { useState, useEffect } from 'react'

interface CopyWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (date: string) => void
  isSaving?: boolean
}

export default function CopyWorkoutModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: CopyWorkoutModalProps) {
  const [targetDate, setTargetDate] = useState(() =>
    new Date().toISOString().split('T')[0],
  )

  useEffect(() => {
    if (isOpen) {
      setTargetDate(new Date().toISOString().split('T')[0])
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(targetDate)
  }

  return (
    <div
      className="add-workout-modal-overlay copy-workout-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-workout-modal-title"
    >
      <div
        className="add-workout-modal copy-workout-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="add-workout-modal-header">
          <h2 id="copy-workout-modal-title">Скопировать тренировку на другую дату</h2>
          <button
            type="button"
            onClick={onClose}
            className="add-workout-modal-close"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="add-workout-modal-body">
          <div className="form-group">
            <label htmlFor="copy-workout-date">Выберите дату:</label>
            <input
              id="copy-workout-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="workout-date-input"
            />
          </div>
          <div className="copy-workout-modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Отмена
            </button>
            <button type="submit" className="save-btn" disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
