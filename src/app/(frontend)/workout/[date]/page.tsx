import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'

import config from '@/payload.config'

interface Workout {
  id: string
  name: string
  date: string
  exercises: Array<{
    name: string
    exerciseType: 'strength' | 'cardio'
    sets: Array<{
      reps?: string
      weight?: string
      duration?: string
      distance?: string
      notes?: string
    }>
  }>
  notes?: string
  duration?: number
}

interface PageProps {
  params: {
    date: string
  }
}

export default async function WorkoutDayPage({ params }: PageProps) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Получаем тренировки за указанную дату
  const workouts = await payload.find({
    collection: 'workouts',
    where: {
      date: {
        equals: params.date,
      },
    },
    sort: '-createdAt',
  })

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
    <div className="workout-day-page">
      <div className="header">
        <Link href="/" className="back-link">
          ← Назад к дневнику
        </Link>
        <h1>Тренировки за {formatDate(params.date)}</h1>
      </div>

      {workouts.docs.length === 0 ? (
        <div className="no-workouts">
          <p>В этот день тренировок не было</p>
          <Link href="/" className="add-workout-link">
            Добавить тренировку
          </Link>
        </div>
      ) : (
        <div className="workouts-list">
          {workouts.docs.map((workout: Workout) => (
            <div key={workout.id} className="workout-card">
              <div className="workout-header">
                <h2>{workout.name}</h2>
                {workout.duration && <span className="duration">⏱️ {workout.duration} мин</span>}
              </div>

              <div className="exercises">
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="exercise">
                    <h3>{exercise.name}</h3>
                    <div className="sets">
                      {exercise.sets.map((set, setIndex) => (
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
                ))}
              </div>

              {workout.notes && (
                <div className="workout-notes">
                  <h4>Заметки:</h4>
                  <p>{workout.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
