'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { showToast } from '@/lib/toast'
import { confirmAction } from '../../components/ConfirmDialog'

interface Exercise {
  id: string
  name: string
  exerciseType: 'strength' | 'cardio'
  muscleGroup?: string | null
  description?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

const MUSCLE_GROUPS = [
  { label: 'Грудь', value: 'chest' },
  { label: 'Спина', value: 'back' },
  { label: 'Плечи', value: 'shoulders' },
  { label: 'Руки', value: 'arms' },
  { label: 'Ноги', value: 'legs' },
  { label: 'Пресс', value: 'core' },
  { label: 'Кардио', value: 'cardio' },
  { label: 'Другое', value: 'other' },
]

const EXERCISE_TYPES = [
  { label: 'Силовое', value: 'strength' },
  { label: 'Кардио', value: 'cardio' },
]

const getMuscleGroupLabel = (value: string | null | undefined): string => {
  if (!value) return '—'
  const group = MUSCLE_GROUPS.find((g) => g.value === value)
  return group ? group.label : value
}

const getExerciseTypeLabel = (value: string): string => {
  const type = EXERCISE_TYPES.find((t) => t.value === value)
  return type ? type.label : value
}

const emptyForm = {
  name: '',
  exerciseType: 'strength' as 'strength' | 'cardio',
  muscleGroup: '',
  description: '',
  notes: '',
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  // Фильтры
  const [filterMuscleGroup, setFilterMuscleGroup] = useState('')
  const [filterType, setFilterType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchExercises = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (filterMuscleGroup) params.set('muscleGroup', filterMuscleGroup)
      if (filterType) params.set('exerciseType', filterType)

      const res = await fetch(`/api/exercises?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setExercises(data.docs || [])
    } catch (error) {
      console.error('Error fetching exercises:', error)
      showToast.error('Ошибка загрузки упражнений')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, filterMuscleGroup, filterType])

  useEffect(() => {
    fetchExercises()
  }, [fetchExercises])

  const openCreateModal = () => {
    setEditingExercise(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise)
    setForm({
      name: exercise.name,
      exerciseType: exercise.exerciseType,
      muscleGroup: exercise.muscleGroup || '',
      description: exercise.description || '',
      notes: exercise.notes || '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingExercise(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      showToast.error('Введите название упражнения')
      return
    }

    setSaving(true)
    try {
      const url = editingExercise ? `/api/exercises/${editingExercise.id}` : '/api/exercises'
      const method = editingExercise ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Failed to save')

      showToast.success(editingExercise ? 'Упражнение обновлено' : 'Упражнение создано')
      closeModal()
      fetchExercises()
    } catch (error) {
      console.error('Error saving exercise:', error)
      showToast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (exercise: Exercise) => {
    const confirmed = await confirmAction(`Удалить упражнение "${exercise.name}"?`)
    if (!confirmed) return

    try {
      const res = await fetch(`/api/exercises/${exercise.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      showToast.success('Упражнение удалено')
      fetchExercises()
    } catch (error) {
      console.error('Error deleting exercise:', error)
      showToast.error('Ошибка удаления')
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setFilterMuscleGroup('')
    setFilterType('')
  }

  const hasFilters = searchQuery || filterMuscleGroup || filterType

  return (
    <div className="triptych-container">
      <main className="center-content">
        <div className="exercises-page">
          {/* Заголовок */}
          <div className="exercises-header">
            <h1>Упражнения</h1>
            <button className="add-workout-btn" onClick={openCreateModal}>
              + Добавить упражнение
            </button>
          </div>

          {/* Фильтры */}
          <div className="exercises-filters">
            <div className="exercises-search">
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="exercises-search-input"
              />
            </div>
            <div className="exercises-filter-row">
              <select
                value={filterMuscleGroup}
                onChange={(e) => setFilterMuscleGroup(e.target.value)}
                className="exercises-filter-select"
              >
                <option value="">Все группы мышц</option>
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="exercises-filter-select"
              >
                <option value="">Все типы</option>
                {EXERCISE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {hasFilters && (
                <button className="exercises-reset-btn" onClick={resetFilters}>
                  Сбросить
                </button>
              )}
            </div>
          </div>

          {/* Список */}
          {loading ? (
            <div className="exercises-placeholder">Загрузка...</div>
          ) : exercises.length === 0 ? (
            <div className="exercises-placeholder">
              {hasFilters
                ? 'Упражнения не найдены. Попробуйте изменить фильтры.'
                : 'Нет упражнений. Добавьте первое упражнение!'}
            </div>
          ) : (
            <div className="exercises-list-grid">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="exercise-card">
                  <div className="exercise-card-header">
                    <div className="exercise-card-title">
                      <h3>{exercise.name}</h3>
                      <div className="exercise-card-badges">
                        <span className={`exercise-badge exercise-badge-type ${exercise.exerciseType}`}>
                          {getExerciseTypeLabel(exercise.exerciseType)}
                        </span>
                        {exercise.muscleGroup && (
                          <span className="exercise-badge exercise-badge-muscle">
                            {getMuscleGroupLabel(exercise.muscleGroup)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="exercise-card-actions">
                      <button
                        className="edit-btn icon-only"
                        onClick={() => openEditModal(exercise)}
                        title="Редактировать"
                      >
                        ✏️
                      </button>
                      <button
                        className="delete-btn icon-only"
                        onClick={() => handleDelete(exercise)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  {exercise.description && (
                    <p className="exercise-card-description">{exercise.description}</p>
                  )}
                  {exercise.notes && (
                    <p className="exercise-card-notes">{exercise.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Модалка создания / редактирования */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingExercise ? 'Редактировать упражнение' : 'Новое упражнение'}</h2>
                <button className="close-btn" onClick={closeModal}>
                  ×
                </button>
              </div>
              <form className="modal-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Название *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Название упражнения"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Тип упражнения</label>
                  <select
                    value={form.exerciseType}
                    onChange={(e) =>
                      setForm({ ...form, exerciseType: e.target.value as 'strength' | 'cardio' })
                    }
                  >
                    {EXERCISE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Группа мышц</label>
                  <select
                    value={form.muscleGroup}
                    onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
                  >
                    <option value="">Не указана</option>
                    {MUSCLE_GROUPS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Описание</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Описание техники выполнения..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Заметки</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Дополнительные заметки..."
                    rows={2}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={closeModal}>
                    Отмена
                  </button>
                  <button type="submit" className="submit-btn" disabled={saving}>
                    {saving ? 'Сохранение...' : editingExercise ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
