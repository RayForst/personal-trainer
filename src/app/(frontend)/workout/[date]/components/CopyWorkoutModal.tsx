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
      className="add-workout-modal-overlay fixed inset-0 bg-black/45 z-[1000] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-workout-modal-title"
    >
      <div
        className="add-workout-modal bg-white rounded-xl shadow-2xl w-full max-w-[400px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center py-5 px-6 border-b border-gray-200 shrink-0">
          <h2 id="copy-workout-modal-title" className="m-0 text-xl text-gray-800">
            Скопировать тренировку на другую дату
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="bg-transparent border-none text-2xl leading-none text-gray-500 cursor-pointer p-1 -m-1 rounded hover:bg-gray-100 hover:text-gray-800 transition-colors"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="copy-workout-date" className="font-semibold text-gray-600 text-sm">
              Выберите дату:
            </label>
            <input
              id="copy-workout-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="py-2 px-3 border border-gray-300 rounded-md text-base w-full focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_2px_rgba(0,123,255,0.25)]"
            />
          </div>
          <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-6 bg-gray-500 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-gray-600"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="py-3 px-6 bg-green-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
