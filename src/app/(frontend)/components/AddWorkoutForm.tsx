'use client'

import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { Workout } from '@/payload-types'

interface AddWorkoutFormProps {
  templates: Workout[]
}

export default function AddWorkoutForm({ templates }: AddWorkoutFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    template: '',
    exercises: [] as Array<{
      name: string
      exerciseType: 'strength' | 'cardio'
      sets: Array<{
        reps: string
        weight: string
        duration: string
        distance: string
        notes: string
      }>
    }>,
    notes: '',
    duration: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      setFormData((prev) => ({
        ...prev,
        template: templateId,
        exercises:
          template.exercises?.map((exercise) => ({
            name: exercise.name,
            exerciseType: exercise.exerciseType || 'strength',
            sets:
              exercise.sets?.map((set) => ({
                reps: set.reps || '',
                weight: set.weight || '',
                duration: set.duration || '',
                distance: set.distance || '',
                notes: set.notes || '',
              })) || [],
          })) || [],
      }))
    } else {
      // Если шаблон не выбран, очищаем упражнения
      setFormData((prev) => ({
        ...prev,
        template: '',
        exercises: [],
      }))
    }
  }

  const addExercise = () => {
    setFormData((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          name: '',
          exerciseType: 'strength' as const,
          sets: [{ reps: '', weight: '', duration: '', distance: '', notes: '' }],
        },
      ],
    }))
  }

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const newExercises = Array.from(formData.exercises)
    const [reorderedExercise] = newExercises.splice(result.source.index, 1)
    newExercises.splice(result.destination.index, 0, reorderedExercise)

    setFormData((prev) => ({
      ...prev,
      exercises: newExercises,
    }))
  }

  const removeExercise = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index),
    }))
  }

  const updateExercise = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === index ? { ...exercise, [field]: value } : exercise,
      ),
    }))
  }

  const addSet = (exerciseIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: [
                ...exercise.sets,
                { reps: '', weight: '', duration: '', distance: '', notes: '' },
              ],
            }
          : exercise,
      ),
    }))
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.filter((_, j) => j !== setIndex),
            }
          : exercise,
      ),
    }))
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) =>
        i === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, j) =>
                j === setIndex ? { ...set, [field]: value } : set,
              ),
            }
          : exercise,
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        // Сброс формы
        setFormData({
          name: '',
          date: new Date().toISOString().split('T')[0],
          template: '',
          exercises: [],
          notes: '',
          duration: '',
        })
        alert('Тренировка успешно добавлена!')
        window.location.reload()
      } else {
        alert('Ошибка при добавлении тренировки')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Ошибка при добавлении тренировки')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-workout-form">
      <div className="form-group">
        <label htmlFor="name">Название тренировки:</label>
        <input
          type="text"
          id="name"
          placeholder="Например: Утренняя тренировка, День ног, Кардио"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="template">Повторить предыдущую тренировку:</label>
        <select
          id="template"
          value={formData.template}
          onChange={(e) => handleTemplateChange(e.target.value)}
        >
          <option value="">Выберите тренировку (опционально)</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} ({new Date(template.date).toLocaleDateString('ru-RU')})
            </option>
          ))}
        </select>
        <small className="form-help">
          Выберите предыдущую тренировку, чтобы повторить упражнения, или добавьте упражнения
          вручную ниже
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="date">Дата тренировки:</label>
        <input
          type="date"
          id="date"
          value={formData.date}
          onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
          required
        />
      </div>

      <div className="form-group">
        <label>Упражнения:</label>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="exercises">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="exercises-list">
                {formData.exercises.map((exercise, exerciseIndex) => (
                  <Draggable
                    key={exerciseIndex}
                    draggableId={`exercise-${exerciseIndex}`}
                    index={exerciseIndex}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`exercise-block ${snapshot.isDragging ? 'dragging' : ''}`}
                      >
                        <div className="exercise-header">
                          <div
                            {...provided.dragHandleProps}
                            className="drag-handle"
                            title="Перетащите для изменения порядка"
                          >
                            ⋮⋮
                          </div>
                          <input
                            type="text"
                            placeholder="Название упражнения"
                            value={exercise.name}
                            onChange={(e) => updateExercise(exerciseIndex, 'name', e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeExercise(exerciseIndex)}
                            className="remove-exercise"
                          >
                            Удалить
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
                              <span>Силовое (вес + повторения)</span>
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
                              <span>Кардио (время)</span>
                            </label>
                          </div>
                        </div>

                        <div className="sets-container">
                          {exercise.sets.map((set, setIndex) => (
                            <div key={setIndex} className="set-row">
                              <span className="set-number">Подход {setIndex + 1}:</span>

                              {exercise.exerciseType === 'strength' ? (
                                <>
                                  <input
                                    type="text"
                                    placeholder="Повторения"
                                    value={set.reps}
                                    onChange={(e) =>
                                      updateSet(exerciseIndex, setIndex, 'reps', e.target.value)
                                    }
                                  />
                                  <input
                                    type="text"
                                    placeholder="Вес (кг)"
                                    value={set.weight}
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
                                    value={set.duration}
                                    onChange={(e) =>
                                      updateSet(exerciseIndex, setIndex, 'duration', e.target.value)
                                    }
                                  />
                                  <input
                                    type="text"
                                    placeholder="Дистанция (км)"
                                    value={set.distance}
                                    onChange={(e) =>
                                      updateSet(exerciseIndex, setIndex, 'distance', e.target.value)
                                    }
                                  />
                                </>
                              )}

                              <input
                                type="text"
                                placeholder="Заметки"
                                value={set.notes}
                                onChange={(e) =>
                                  updateSet(exerciseIndex, setIndex, 'notes', e.target.value)
                                }
                              />
                              <button
                                type="button"
                                onClick={() => removeSet(exerciseIndex, setIndex)}
                                className="remove-set"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addSet(exerciseIndex)}
                            className="add-set"
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

        <button type="button" onClick={addExercise} className="add-exercise">
          + Добавить упражнение
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="duration">Длительность тренировки (минуты):</label>
        <input
          type="number"
          id="duration"
          value={formData.duration}
          onChange={(e) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Заметки:</label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="submit-btn">
        {isSubmitting ? 'Добавление...' : 'Добавить тренировку'}
      </button>
    </form>
  )
}
