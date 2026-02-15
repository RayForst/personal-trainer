'use client'

import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import type { Workout } from '@/payload-types'
import { showToast } from '@/lib/toast'

interface AddWorkoutFormProps {
  templates: Workout[]
  onSuccess?: () => void
}

type TabType = 'workout' | 'skip' | 'goal'

export default function AddWorkoutForm({ templates, onSuccess }: AddWorkoutFormProps) {
  const [activeTab, setActiveTab] = useState<TabType>('workout')
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

  // Состояние для формы пропуска
  const [skipData, setSkipData] = useState({
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    reason: '',
    customReason: '',
    color: 'blue' as 'blue' | 'red' | 'orange' | 'yellow',
    notes: '',
  })

  // Состояние для формы цели
  const [goalData, setGoalData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    endDate: '',
    unit: '',
    notes: '',
    image: null as File | null,
  })

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

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

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
        showToast.success('Тренировка успешно добавлена!')
        if (onSuccess) onSuccess()
        else window.location.reload()
      } else {
        showToast.error('Ошибка при добавлении тренировки')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast.error('Ошибка при добавлении тренировки')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkipSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Определяем диапазон дат
      const startDate = new Date(skipData.date)
      const endDate = skipData.endDate ? new Date(skipData.endDate) : startDate

      // Создаем массив дат для пропуска
      const datesToSkip: string[] = []
      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        datesToSkip.push(currentDate.toISOString().split('T')[0])
        currentDate.setDate(currentDate.getDate() + 1)
      }

      // Отправляем один запрос с массивом дат
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Пропуск тренировки',
          dates: datesToSkip,
          skipEndDate: skipData.endDate || skipData.date,
          skipReason: skipData.reason,
          customReason: skipData.customReason,
          skipColor: skipData.color,
          notes: skipData.notes,
        }),
      })

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        // Сброс формы пропуска
        setSkipData({
          date: new Date().toISOString().split('T')[0],
          endDate: '',
          reason: '',
          customReason: '',
          color: 'blue',
          notes: '',
        })
        showToast.success(`Пропуск тренировки отмечен для ${datesToSkip.length} дня(ей)!`)
        if (onSuccess) onSuccess()
        else window.location.reload()
      } else {
        showToast.error('Ошибка при отметке пропуска')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast.error('Ошибка при отметке пропуска')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Создаём FormData для отправки файла
      const formData = new FormData()
      formData.append('name', goalData.name)
      formData.append('date', goalData.date)
      formData.append('endDate', goalData.endDate || '')
      formData.append('unit', goalData.unit)
      formData.append('notes', goalData.notes)
      
      if (goalData.image) {
        formData.append('image', goalData.image)
      }

      const response = await fetch('/api/goals', {
        method: 'POST',
        body: formData,
      })

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (response.ok) {
        // Сброс формы цели
        setGoalData({
          name: '',
          date: new Date().toISOString().split('T')[0],
          endDate: '',
          unit: '',
          notes: '',
          image: null,
        })
        showToast.success('Цель успешно добавлена!')
        if (onSuccess) onSuccess()
        else window.location.reload()
      } else {
        showToast.error('Ошибка при добавлении цели')
      }
    } catch (error) {
      console.error('Error:', error)
      showToast.error('Ошибка при добавлении цели')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="add-workout-form-container">
      {/* Табы */}
      <div className="form-tabs">
        <button
          type="button"
          className={`tab-button ${activeTab === 'workout' ? 'active' : ''}`}
          onClick={() => setActiveTab('workout')}
        >
          Добавить тренировку
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'skip' ? 'active' : ''}`}
          onClick={() => setActiveTab('skip')}
        >
          Пропуск
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === 'goal' ? 'active' : ''}`}
          onClick={() => setActiveTab('goal')}
        >
          Цель
        </button>
      </div>

      {/* Контент табов */}
      {activeTab === 'workout' ? (
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
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="exercises-list"
                  >
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
                                onChange={(e) =>
                                  updateExercise(exerciseIndex, 'name', e.target.value)
                                }
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
                                        value={set.duration}
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
                                        value={set.distance}
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
      ) : activeTab === 'skip' ? (
        <form onSubmit={handleSkipSubmit} className="add-workout-form">
          <div className="form-group">
            <label htmlFor="skip-date">Дата начала пропуска:</label>
            <input
              type="date"
              id="skip-date"
              value={skipData.date}
              onChange={(e) => setSkipData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="skip-end-date">Дата окончания пропуска (опционально):</label>
            <input
              type="date"
              id="skip-end-date"
              value={skipData.endDate}
              onChange={(e) => setSkipData((prev) => ({ ...prev, endDate: e.target.value }))}
              min={skipData.date}
            />
            <small className="form-help">Оставьте пустым для пропуска одного дня</small>
          </div>

          <div className="form-group">
            <label htmlFor="skip-reason">Причина пропуска:</label>
            <select
              id="skip-reason"
              value={skipData.reason}
              onChange={(e) => setSkipData((prev) => ({ ...prev, reason: e.target.value }))}
              required
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

          {skipData.reason === 'other' && (
            <div className="form-group">
              <label htmlFor="custom-reason">Укажите причину:</label>
              <input
                type="text"
                id="custom-reason"
                placeholder="Введите причину пропуска"
                value={skipData.customReason}
                onChange={(e) => setSkipData((prev) => ({ ...prev, customReason: e.target.value }))}
                required={skipData.reason === 'other'}
              />
            </div>
          )}

          <div className="form-group">
            <label>Цвет для отображения:</label>
            <div className="color-options">
              <label className="color-option">
                <input
                  type="radio"
                  name="skip-color"
                  value="blue"
                  checked={skipData.color === 'blue'}
                  onChange={(e) =>
                    setSkipData((prev) => ({ ...prev, color: e.target.value as any }))
                  }
                />
                <span className="color-preview blue"></span>
                <span>Синий</span>
              </label>
              <label className="color-option">
                <input
                  type="radio"
                  name="skip-color"
                  value="red"
                  checked={skipData.color === 'red'}
                  onChange={(e) =>
                    setSkipData((prev) => ({ ...prev, color: e.target.value as any }))
                  }
                />
                <span className="color-preview red"></span>
                <span>Красный</span>
              </label>
              <label className="color-option">
                <input
                  type="radio"
                  name="skip-color"
                  value="orange"
                  checked={skipData.color === 'orange'}
                  onChange={(e) =>
                    setSkipData((prev) => ({ ...prev, color: e.target.value as any }))
                  }
                />
                <span className="color-preview orange"></span>
                <span>Оранжевый</span>
              </label>
              <label className="color-option">
                <input
                  type="radio"
                  name="skip-color"
                  value="yellow"
                  checked={skipData.color === 'yellow'}
                  onChange={(e) =>
                    setSkipData((prev) => ({ ...prev, color: e.target.value as any }))
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
              value={skipData.notes}
              onChange={(e) => setSkipData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Дополнительные заметки о пропуске..."
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'Отметка пропуска...' : 'Отметить пропуск'}
          </button>
        </form>
      ) : activeTab === 'goal' ? (
        <form onSubmit={handleGoalSubmit} className="add-workout-form">
          <div className="form-group">
            <label htmlFor="goal-name">Название цели:</label>
            <input
              type="text"
              id="goal-name"
              placeholder="Например: Бросить курить, Научиться прыгать на скакалке"
              value={goalData.name}
              onChange={(e) => setGoalData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
            <small className="form-help">Название цели, которую вы хотите отслеживать</small>
          </div>

          <div className="form-group">
            <label htmlFor="goal-date">Дата:</label>
            <input
              type="date"
              id="goal-date"
              value={goalData.date}
              onChange={(e) => setGoalData((prev) => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-end-date">Дата завершения (опционально):</label>
            <input
              type="date"
              id="goal-end-date"
              value={goalData.endDate}
              onChange={(e) => setGoalData((prev) => ({ ...prev, endDate: e.target.value }))}
              min={goalData.date}
            />
            <small className="form-help">
              Дата, когда цель была завершена
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="goal-unit">Единица измерения (опционально):</label>
            <input
              type="text"
              id="goal-unit"
              placeholder="Например: сигарет, секунд, раз"
              value={goalData.unit}
              onChange={(e) => setGoalData((prev) => ({ ...prev, unit: e.target.value }))}
            />
            <small className="form-help">Единица измерения для лучшего понимания значения</small>
          </div>

          <div className="form-group">
            <label htmlFor="goal-notes">Заметки:</label>
            <textarea
              id="goal-notes"
              value={goalData.notes}
              onChange={(e) => setGoalData((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Дополнительные заметки о цели..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="goal-image">Изображение для фона (опционально):</label>
            <input
              type="file"
              id="goal-image"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null
                setGoalData((prev) => ({ ...prev, image: file }))
              }}
            />
            <small className="form-help">
              Изображение будет использоваться как фон карточки цели в статистике
            </small>
            {goalData.image && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                Выбрано: {goalData.image.name}
              </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'Добавление цели...' : 'Добавить цель'}
          </button>
        </form>
      ) : null}
    </div>
  )
}
