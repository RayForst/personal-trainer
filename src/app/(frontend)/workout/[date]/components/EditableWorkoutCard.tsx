'use client'

import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { Workout } from '@/payload-types'

interface EditableWorkoutCardProps {
  workout: Workout
  onDelete: (workoutId: string) => void
  onUpdate: (workoutId: string, updatedWorkout: Workout) => void
}

export default function EditableWorkoutCard({
  workout,
  onDelete,
  onUpdate,
}: EditableWorkoutCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedWorkout, setEditedWorkout] = useState(workout)
  const [isDeleting, setIsDeleting] = useState(false)

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
    if (window.confirm('Вы уверены, что хотите удалить эту тренировку?')) {
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
          onDelete(workout.id)
        } else {
          alert('Ошибка при удалении тренировки')
        }
      } catch (error) {
        console.error('Error deleting workout:', error)
        alert('Ошибка при удалении тренировки')
      } finally {
        setIsDeleting(false)
      }
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
        alert('Тренировка обновлена!')
      } else {
        alert('Ошибка при обновлении тренировки')
      }
    } catch (error) {
      console.error('Error updating workout:', error)
      alert('Ошибка при обновлении тренировки')
    }
  }

  const handleCancel = () => {
    setEditedWorkout(workout)
    setIsEditing(false)
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
    newExercises[exerciseIndex].sets.push({
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
    newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter(
      (_, index) => index !== setIndex,
    )
    setEditedWorkout({
      ...editedWorkout,
      exercises: newExercises,
    })
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    const newExercises = [...(editedWorkout.exercises || [])]
    newExercises[exerciseIndex].sets[setIndex] = {
      ...newExercises[exerciseIndex].sets[setIndex],
      [field]: value,
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
              <button onClick={() => setIsEditing(true)} className="edit-btn">
                ✏️ Редактировать
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="delete-btn">
                {isDeleting ? 'Удаление...' : '🗑️ Удалить'}
              </button>
            </div>
          ) : (
            <div className="action-buttons">
              <button onClick={handleSave} className="save-btn">
                💾 Сохранить
              </button>
              <button onClick={handleCancel} className="cancel-btn">
                ❌ Отмена
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
          </div>
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
                                    updateExercise(exerciseIndex, 'exerciseType', e.target.value)
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
                                    updateExercise(exerciseIndex, 'exerciseType', e.target.value)
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
                                        updateSet(exerciseIndex, setIndex, 'reps', e.target.value)
                                      }
                                    />
                                    <input
                                      type="text"
                                      placeholder="Вес (кг)"
                                      value={set.weight || ''}
                                      onChange={(e) =>
                                        updateSet(exerciseIndex, setIndex, 'weight', e.target.value)
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
                <div className="sets">
                  {(exercise.sets || []).map((set, setIndex) => (
                    <div key={setIndex} className="set">
                      <span className="set-number">Подход {setIndex + 1}:</span>
                      {exercise.exerciseType === 'strength' ? (
                        <>
                          {set.reps && <span>Повторения: {set.reps}</span>}
                          {set.weight && <span>Вес: {set.weight} кг</span>}
                        </>
                      ) : (
                        <>
                          {set.duration && <span>Время: {set.duration}</span>}
                          {set.distance && <span>Дистанция: {set.distance} км</span>}
                        </>
                      )}
                      {set.notes && <span className="notes">Заметки: {set.notes}</span>}
                    </div>
                  ))}
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
    </div>
  )
}
