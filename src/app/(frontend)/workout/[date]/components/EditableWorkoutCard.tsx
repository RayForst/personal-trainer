'use client'

import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { Workout } from '@/payload-types'
import { showToast } from '@/lib/toast'
import { confirmAction } from '@/app/(frontend)/components/ConfirmDialog'
import CopyWorkoutModal from './CopyWorkoutModal'

interface EditableWorkoutCardProps {
  workout: Workout
  onDelete: (workoutId: string) => void
  onUpdate: (workoutId: string, updatedWorkout: Workout) => void
  onCopy?: (newWorkout: Workout) => void
}

export default function EditableWorkoutCard({
  workout,
  onDelete,
  onUpdate,
  onCopy,
}: EditableWorkoutCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedWorkout, setEditedWorkout] = useState(workout)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  // Функция для расчета тоннажа упражнения
  const calculateExerciseTonnage = (exercise: any) => {
    if (exercise.exerciseType !== 'strength') return 0

    let totalTonnage = 0
    exercise.sets?.forEach((set: any) => {
      if (set.reps && set.weight) {
        const reps = parseInt(set.reps) || 0
        const weight = parseFloat(set.weight) || 0
        totalTonnage += reps * weight
      }
    })

    return Math.round(totalTonnage * 100) / 100
  }

  // Функция для форматирования времени в hh:mm:ss
  const formatDuration = (duration: string | null | undefined): string => {
    if (!duration) return ''

    const durationStr = duration.trim()
    let totalSeconds = 0

    if (durationStr.includes(':')) {
      // Формат "мм:сс" или "чч:мм:сс"
      const parts = durationStr.split(':').map(Number)
      if (parts.length === 2) {
        // мм:сс
        totalSeconds = parts[0] * 60 + (parts[1] || 0)
      } else if (parts.length === 3) {
        // чч:мм:сс
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0)
      }
    } else {
      // Просто число - определяем формат по значению
      const num = parseFloat(durationStr)
      if (!isNaN(num)) {
        if (num <= 300) {
          // Секунды
          totalSeconds = Math.round(num)
        } else {
          // Минуты -> секунды
          totalSeconds = Math.round(num * 60)
        }
      }
    }

    if (totalSeconds === 0) return ''

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const newExercises = Array.from(editedWorkout.exercises || [])
    const [reorderedExercise] = newExercises.splice(result.source.index, 1)
    newExercises.splice(result.destination.index, 0, reorderedExercise)

    const updatedWorkout = {
      ...editedWorkout,
      exercises: newExercises,
    }

    setEditedWorkout(updatedWorkout)
    onUpdate(workout.id, updatedWorkout)
  }

  const handleDelete = async () => {
    const confirmed = await confirmAction('Вы уверены, что хотите удалить эту тренировку?')
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/workouts/${workout.id}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        showToast.success('Тренировка успешно удалена')
        onDelete(workout.id)
      } else {
        showToast.error('Ошибка при удалении тренировки')
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
      showToast.error('Ошибка при удалении тренировки')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/workouts/${workout.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedWorkout),
      })

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        setIsEditing(false)
        showToast.success('Тренировка обновлена!')
      } else {
        showToast.error('Ошибка при обновлении тренировки')
      }
    } catch (error) {
      console.error('Error updating workout:', error)
      showToast.error('Ошибка при обновлении тренировки')
    }
  }

  const handleCancel = () => {
    setEditedWorkout(workout)
    setIsEditing(false)
  }

  const handleCopyToDate = async (targetDate: string) => {
    setIsCopying(true)
    try {
      const body = {
        name: editedWorkout.name,
        date: targetDate,
        exercises: (editedWorkout.exercises || []).map((ex) => ({
          name: ex.name,
          exerciseType: ex.exerciseType || 'strength',
          sets: (ex.sets || []).map((set) => ({
            reps: set.reps ?? '',
            weight: set.weight ?? '',
            duration: set.duration ?? '',
            distance: set.distance ?? '',
            notes: set.notes ?? '',
          })),
        })),
        duration: editedWorkout.duration ?? undefined,
        notes: editedWorkout.notes ?? undefined,
      }

      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (!response.ok) {
        showToast.error('Ошибка при копировании тренировки')
        return
      }

      const newWorkout = (await response.json()) as Workout
      showToast.success('Тренировка скопирована!')
      setIsCopyModalOpen(false)
      onCopy?.(newWorkout)
    } catch (error) {
      console.error('Error copying workout:', error)
      showToast.error('Ошибка при копировании тренировки')
    } finally {
      setIsCopying(false)
    }
  }

  const addExercise = () => {
    const newExercise = {
      name: '',
      exerciseType: 'strength' as const,
      sets: [{ reps: '', weight: '', duration: '', distance: '', notes: '' }],
    }

    setEditedWorkout({
      ...editedWorkout,
      exercises: [...(editedWorkout.exercises || []), newExercise],
    })
  }

  const removeExercise = (exerciseIndex: number) => {
    const newExercises = (editedWorkout.exercises || []).filter(
      (_, index) => index !== exerciseIndex,
    )
    setEditedWorkout({
      ...editedWorkout,
      exercises: newExercises,
    })
  }

  const updateExercise = (exerciseIndex: number, field: string, value: any) => {
    const newExercises = [...(editedWorkout.exercises || [])]
    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      [field]: value,
    }
    setEditedWorkout({
      ...editedWorkout,
      exercises: newExercises,
    })
  }

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...(editedWorkout.exercises || [])]
    const exercise = newExercises[exerciseIndex]
    if (!exercise.sets) {
      exercise.sets = []
    }
    exercise.sets.push({
      reps: '',
      weight: '',
      duration: '',
      distance: '',
      notes: '',
    })
    setEditedWorkout({
      ...editedWorkout,
      exercises: newExercises,
    })
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...(editedWorkout.exercises || [])]
    const exercise = newExercises[exerciseIndex]
    if (exercise.sets) {
      exercise.sets = exercise.sets.filter((_, index) => index !== setIndex)
    }
    setEditedWorkout({
      ...editedWorkout,
      exercises: newExercises,
    })
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    const newExercises = [...(editedWorkout.exercises || [])]
    const exercise = newExercises[exerciseIndex]
    if (exercise.sets && exercise.sets[setIndex]) {
      exercise.sets[setIndex] = {
        ...exercise.sets[setIndex],
        [field]: value,
      }
    }
    setEditedWorkout({
      ...editedWorkout,
      exercises: newExercises,
    })
  }

  return (
    <div className="workout-card">
      <div className="workout-header">
        <h2>{editedWorkout.name}</h2>
        <div className="workout-actions">
          {workout.duration && <span className="duration">⏱️ {workout.duration} мин</span>}
          {!isEditing ? (
            <div className="action-buttons">
              <button
                onClick={() => setIsEditing(true)}
                className="edit-btn icon-only"
                title="Редактировать"
              >
                ✏️
              </button>
              <button
                onClick={() => setIsCopyModalOpen(true)}
                className="copy-btn icon-only"
                title="Скопировать на другую дату"
              >
                📋
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="delete-btn icon-only"
                title={isDeleting ? 'Удаление...' : 'Удалить'}
              >
                {isDeleting ? '⏳' : '🗑️'}
              </button>
            </div>
          ) : (
            <div className="action-buttons">
              <button onClick={handleSave} className="save-btn icon-only" title="Сохранить">
                💾
              </button>
              <button onClick={handleCancel} className="cancel-btn icon-only" title="Отмена">
                ❌
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="editable-exercises">
          <div className="workout-edit-fields">
            <div className="form-group">
              <label htmlFor="workout-name">Название тренировки:</label>
              <input
                id="workout-name"
                type="text"
                value={editedWorkout.name}
                onChange={(e) => setEditedWorkout({ ...editedWorkout, name: e.target.value })}
                className="workout-name-input"
                placeholder="Название тренировки"
              />
            </div>
            <div className="form-group">
              <label htmlFor="workout-date">Дата тренировки:</label>
              <input
                id="workout-date"
                type="date"
                value={new Date(editedWorkout.date).toISOString().split('T')[0]}
                onChange={(e) => setEditedWorkout({ ...editedWorkout, date: e.target.value })}
                className="workout-date-input"
              />
            </div>
            {editedWorkout.isSkip && (
              <>
                <div className="form-group">
                  <label htmlFor="skip-end-date">Дата окончания пропуска (опционально):</label>
                  <input
                    id="skip-end-date"
                    type="date"
                    value={
                      editedWorkout.skipEndDate
                        ? new Date(editedWorkout.skipEndDate).toISOString().split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      setEditedWorkout({
                        ...editedWorkout,
                        skipEndDate: e.target.value || null,
                      })
                    }
                    min={new Date(editedWorkout.date).toISOString().split('T')[0]}
                    className="workout-date-input"
                  />
                  <small className="form-help">Оставьте пустым для пропуска одного дня</small>
                </div>
                <div className="form-group">
                  <label htmlFor="skip-reason">Причина пропуска:</label>
                  <select
                    id="skip-reason"
                    value={editedWorkout.skipReason || ''}
                    onChange={(e) =>
                      setEditedWorkout({
                        ...editedWorkout,
                        skipReason:
                          (e.target.value as
                            | 'injury'
                            | 'illness'
                            | 'gym-closed'
                            | 'natural-disaster'
                            | 'work'
                            | 'travel'
                            | 'family'
                            | 'lazy'
                            | 'other'
                            | null) || null,
                      })
                    }
                  >
                    <option value="">Выберите причину</option>
                    <option value="injury">Травма</option>
                    <option value="illness">Болезнь</option>
                    <option value="gym-closed">Закрытый зал</option>
                    <option value="natural-disaster">Стихийное бедствие</option>
                    <option value="work">Работа</option>
                    <option value="travel">Поездка</option>
                    <option value="family">Семейные дела</option>
                    <option value="lazy">Лень</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                {editedWorkout.skipReason === 'other' && (
                  <div className="form-group">
                    <label htmlFor="custom-reason">Укажите причину:</label>
                    <input
                      type="text"
                      id="custom-reason"
                      placeholder="Введите причину пропуска"
                      value={editedWorkout.customReason || ''}
                      onChange={(e) =>
                        setEditedWorkout({ ...editedWorkout, customReason: e.target.value || null })
                      }
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Цвет для отображения:</label>
                  <div className="color-options">
                    <label className="color-option">
                      <input
                        type="radio"
                        name={`skip-color-${workout.id}`}
                        value="blue"
                        checked={editedWorkout.skipColor === 'blue'}
                        onChange={(e) =>
                          setEditedWorkout({
                            ...editedWorkout,
                            skipColor: e.target.value as any,
                          })
                        }
                      />
                      <span className="color-preview blue"></span>
                      <span>Синий</span>
                    </label>
                    <label className="color-option">
                      <input
                        type="radio"
                        name={`skip-color-${workout.id}`}
                        value="red"
                        checked={editedWorkout.skipColor === 'red'}
                        onChange={(e) =>
                          setEditedWorkout({
                            ...editedWorkout,
                            skipColor: e.target.value as any,
                          })
                        }
                      />
                      <span className="color-preview red"></span>
                      <span>Красный</span>
                    </label>
                    <label className="color-option">
                      <input
                        type="radio"
                        name={`skip-color-${workout.id}`}
                        value="orange"
                        checked={editedWorkout.skipColor === 'orange'}
                        onChange={(e) =>
                          setEditedWorkout({
                            ...editedWorkout,
                            skipColor: e.target.value as any,
                          })
                        }
                      />
                      <span className="color-preview orange"></span>
                      <span>Оранжевый</span>
                    </label>
                    <label className="color-option">
                      <input
                        type="radio"
                        name={`skip-color-${workout.id}`}
                        value="yellow"
                        checked={editedWorkout.skipColor === 'yellow'}
                        onChange={(e) =>
                          setEditedWorkout({
                            ...editedWorkout,
                            skipColor: e.target.value as any,
                          })
                        }
                      />
                      <span className="color-preview yellow"></span>
                      <span>Желтый</span>
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="skip-notes">Заметки:</label>
                  <textarea
                    id="skip-notes"
                    value={editedWorkout.notes || ''}
                    onChange={(e) =>
                      setEditedWorkout({ ...editedWorkout, notes: e.target.value || null })
                    }
                    rows={3}
                    placeholder="Дополнительные заметки о пропуске..."
                  />
                </div>
              </>
            )}
          </div>
          {!editedWorkout.isSkip && (
            <>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="exercises">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="exercises-list"
                    >
                      {(editedWorkout.exercises || []).map((exercise, exerciseIndex) => (
                        <Draggable
                          key={exerciseIndex}
                          draggableId={`exercise-${exerciseIndex}`}
                          index={exerciseIndex}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`exercise ${snapshot.isDragging ? 'dragging' : ''}`}
                            >
                              <div className="exercise-header">
                                <span className="drag-handle">⋮⋮</span>
                                <input
                                  type="text"
                                  value={exercise.name}
                                  onChange={(e) =>
                                    updateExercise(exerciseIndex, 'name', e.target.value)
                                  }
                                  placeholder="Название упражнения"
                                  className="exercise-name-input"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeExercise(exerciseIndex)}
                                  className="remove-exercise-btn"
                                >
                                  ×
                                </button>
                              </div>

                              <div className="exercise-type">
                                <label>Тип упражнения:</label>
                                <div className="radio-group">
                                  <label className="radio-label">
                                    <input
                                      type="radio"
                                      name={`exerciseType-${exerciseIndex}`}
                                      value="strength"
                                      checked={exercise.exerciseType === 'strength'}
                                      onChange={(e) =>
                                        updateExercise(
                                          exerciseIndex,
                                          'exerciseType',
                                          e.target.value,
                                        )
                                      }
                                    />
                                    <span>Силовое</span>
                                  </label>
                                  <label className="radio-label">
                                    <input
                                      type="radio"
                                      name={`exerciseType-${exerciseIndex}`}
                                      value="cardio"
                                      checked={exercise.exerciseType === 'cardio'}
                                      onChange={(e) =>
                                        updateExercise(
                                          exerciseIndex,
                                          'exerciseType',
                                          e.target.value,
                                        )
                                      }
                                    />
                                    <span>Кардио</span>
                                  </label>
                                </div>
                              </div>

                              <div className="sets">
                                {(exercise.sets || []).map((set, setIndex) => (
                                  <div key={setIndex} className="set-row">
                                    <span className="set-number">Подход {setIndex + 1}:</span>

                                    {exercise.exerciseType === 'strength' ? (
                                      <>
                                        <input
                                          type="text"
                                          placeholder="Повторения"
                                          value={set.reps || ''}
                                          onChange={(e) =>
                                            updateSet(
                                              exerciseIndex,
                                              setIndex,
                                              'reps',
                                              e.target.value,
                                            )
                                          }
                                        />
                                        <input
                                          type="text"
                                          placeholder="Вес (кг)"
                                          value={set.weight || ''}
                                          onChange={(e) =>
                                            updateSet(
                                              exerciseIndex,
                                              setIndex,
                                              'weight',
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </>
                                    ) : (
                                      <>
                                        <input
                                          type="text"
                                          placeholder="Время (мин:сек)"
                                          value={set.duration || ''}
                                          onChange={(e) =>
                                            updateSet(
                                              exerciseIndex,
                                              setIndex,
                                              'duration',
                                              e.target.value,
                                            )
                                          }
                                        />
                                        <input
                                          type="text"
                                          placeholder="Дистанция (км)"
                                          value={set.distance || ''}
                                          onChange={(e) =>
                                            updateSet(
                                              exerciseIndex,
                                              setIndex,
                                              'distance',
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </>
                                    )}

                                    <input
                                      type="text"
                                      placeholder="Заметки"
                                      value={set.notes || ''}
                                      onChange={(e) =>
                                        updateSet(exerciseIndex, setIndex, 'notes', e.target.value)
                                      }
                                    />

                                    <button
                                      type="button"
                                      onClick={() => removeSet(exerciseIndex, setIndex)}
                                      className="remove-set-btn"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => addSet(exerciseIndex)}
                                  className="add-set-btn"
                                >
                                  + Добавить подход
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              <button type="button" onClick={addExercise} className="add-exercise-btn">
                + Добавить упражнение
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="exercises">
          {(editedWorkout.exercises || []).map((exercise, exerciseIndex) => {
            const tonnage = calculateExerciseTonnage(exercise)
            return (
              <div key={exerciseIndex} className="exercise">
                <h3>
                  {exercise.name}
                  {tonnage > 0 && (
                    <span className="exercise-tonnage"> - {tonnage.toLocaleString()} кг</span>
                  )}
                </h3>
                <div className="sets-compact">
                  {(exercise.sets || []).map((set, setIndex) => {
                    let setText = ''

                    if (exercise.exerciseType === 'strength') {
                      const parts: string[] = []
                      if (set.reps && set.weight) {
                        parts.push(`${set.reps}×${set.weight} кг`)
                      } else if (set.reps) {
                        parts.push(`${set.reps} повт.`)
                      } else if (set.weight) {
                        parts.push(`${set.weight} кг`)
                      }
                      setText = parts.join(' ')
                    } else {
                      const parts: string[] = []
                      const formattedDuration = formatDuration(set.duration)
                      if (formattedDuration) parts.push(formattedDuration)
                      if (set.distance) parts.push(`${set.distance} км`)
                      setText = parts.join(' ')
                    }

                    if (set.notes) {
                      setText += ` (${set.notes})`
                    }

                    return setText ? (
                      <span key={setIndex} className="set-inline">
                        {setText}
                        {setIndex < (exercise.sets?.length || 0) - 1 && (
                          <span className="set-separator"> | </span>
                        )}
                      </span>
                    ) : null
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {editedWorkout.notes && (
        <div className="workout-notes">
          <h4>Заметки:</h4>
          <p>{editedWorkout.notes}</p>
        </div>
      )}

      <CopyWorkoutModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        onSave={handleCopyToDate}
        isSaving={isCopying}
      />
    </div>
  )
}
