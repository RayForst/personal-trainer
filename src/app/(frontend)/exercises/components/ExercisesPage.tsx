'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
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
    <div className="triptych-container relative flex w-full h-[calc(100vh-var(--header-height))] mt-[var(--header-height)] overflow-hidden">
      <main className="center-content flex-1 flex flex-col gap-6 p-6 overflow-y-auto min-w-0 w-full transition-[margin] duration-300 ease-in-out">
        <div className="w-full max-w-[900px] mx-auto">
          {/* Заголовок */}
          <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
            <h1 className="m-0 text-gray-800 text-[1.8rem]">Упражнения</h1>
            <button
              className="border border-green-600 text-green-600 px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-green-600 hover:text-white"
              onClick={openCreateModal}
            >
              + Добавить упражнение
            </button>
          </div>

          {/* Фильтры */}
          <div className="bg-white rounded-xl p-5 shadow-sm mb-6 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 px-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
            />
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterMuscleGroup}
                onChange={(e) => setFilterMuscleGroup(e.target.value)}
                className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-sm bg-white cursor-pointer transition-colors focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)] min-w-[160px]"
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
                className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-sm bg-white cursor-pointer transition-colors focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)] min-w-[160px]"
              >
                <option value="">Все типы</option>
                {EXERCISE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {hasFilters && (
                <button
                  className="py-2.5 px-4 border border-gray-500 text-gray-500 rounded-lg text-sm cursor-pointer transition-all hover:bg-gray-500 hover:text-white"
                  onClick={resetFilters}
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>

          {/* Список */}
          {loading ? (
            <div className="text-center text-gray-500 py-12 bg-white rounded-xl shadow-sm text-lg">
              Загрузка...
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-white rounded-xl shadow-sm text-lg">
              {hasFilters
                ? 'Упражнения не найдены. Попробуйте изменить фильтры.'
                : 'Нет упражнений. Добавьте первое упражнение!'}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-white rounded-xl p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="m-0 mb-2 text-gray-800 text-[1.15rem]">{exercise.name}</h3>
                      <div className="flex gap-2 flex-wrap">
                        <span
                          className={`inline-block py-1 px-2.5 rounded-xl text-xs font-medium text-white ${
                            exercise.exerciseType === 'strength'
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                              : 'bg-gradient-to-br from-pink-400 to-rose-500'
                          }`}
                        >
                          {getExerciseTypeLabel(exercise.exerciseType)}
                        </span>
                        {exercise.muscleGroup && (
                          <span className="inline-block py-1 px-2.5 rounded-xl text-xs font-medium bg-gray-200 text-gray-600">
                            {getMuscleGroupLabel(exercise.muscleGroup)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 border border-gray-200 text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-colors"
                        onClick={() => openEditModal(exercise)}
                        title="Редактировать"
                      >
                        <Pencil size={18} strokeWidth={2} aria-hidden />
                      </button>
                      <button
                        className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-100 border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors"
                        onClick={() => handleDelete(exercise)}
                        title="Удалить"
                      >
                        <Trash2 size={18} strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                  </div>
                  {exercise.description && (
                    <p className="mt-3 mb-0 text-gray-600 text-sm leading-relaxed">
                      {exercise.description}
                    </p>
                  )}
                  {exercise.notes && (
                    <p className="mt-2 mb-0 text-gray-500 text-sm italic leading-relaxed">
                      {exercise.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Модалка создания / редактирования */}
        {showModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0">
                <h2 className="m-0 text-gray-800 text-2xl">
                  {editingExercise ? 'Редактировать упражнение' : 'Новое упражнение'}
                </h2>
                <button
                  className="w-8 h-8 rounded-full bg-red-600 text-white border-none cursor-pointer flex items-center justify-center text-xl leading-none transition-colors hover:bg-red-700 shrink-0"
                  onClick={closeModal}
                >
                  ×
                </button>
              </div>
              <form className="p-6 flex flex-col gap-6" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-600 text-sm">Название *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Название упражнения"
                    className="py-3 px-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-600 text-sm">Тип упражнения</label>
                  <select
                    value={form.exerciseType}
                    onChange={(e) =>
                      setForm({ ...form, exerciseType: e.target.value as 'strength' | 'cardio' })
                    }
                    className="py-3 px-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                  >
                    {EXERCISE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-600 text-sm">Группа мышц</label>
                  <select
                    value={form.muscleGroup}
                    onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
                    className="py-3 px-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                  >
                    <option value="">Не указана</option>
                    {MUSCLE_GROUPS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-600 text-sm">Описание</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Описание техники выполнения..."
                    rows={3}
                    className="py-3 px-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-600 text-sm">Заметки</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Дополнительные заметки..."
                    rows={2}
                    className="py-3 px-3 border-2 border-gray-200 rounded-lg text-base transition-colors focus:outline-none focus:border-blue-600 focus:shadow-[0_0_0_3px_rgba(0,123,255,0.1)]"
                  />
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="py-3 px-6 bg-gray-500 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-gray-600"
                    onClick={closeModal}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="py-3 px-6 bg-blue-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={saving}
                  >
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
