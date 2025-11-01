'use client'

import React, { useEffect, useState } from 'react'
import type { Goal } from '@/payload-types'
import EditGoalModal from './EditGoalModal'

interface GoalGroup {
  name: string
  image: Goal['image']
  unit: string
  totalEntries: number
  latestValue: number
  latestDate: string
  allValues: number[]
}

export default function GoalsList() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchAllGoals = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data.docs || [])
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllGoals()
  }, [])

  const handleGoalClick = (goalGroup: GoalGroup) => {
    // Находим последнюю цель с таким названием
    const goalName = goalGroup.name.toLowerCase().trim()
    const goalForGroup = goals
      .filter((g) => g.name.toLowerCase().trim() === goalName)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

    if (goalForGroup) {
      setSelectedGoal(goalForGroup)
      setIsModalOpen(true)
    }
  }

  // Группируем цели по названию
  const groupedGoals = goals.reduce(
    (acc, goal) => {
      const key = goal.name.toLowerCase().trim()
      if (!acc[key]) {
        acc[key] = {
          name: goal.name,
          image: goal.image,
          unit: goal.unit || '',
          totalEntries: 0,
          latestValue: 0,
          latestDate: '',
          allValues: [],
        }
      }

      acc[key].totalEntries++
      acc[key].allValues.push(goal.value)

      // Обновляем последнее значение, если эта запись новее
      const goalDate = new Date(goal.date).getTime()
      const currentLatestDate = acc[key].latestDate ? new Date(acc[key].latestDate).getTime() : 0

      if (goalDate >= currentLatestDate) {
        acc[key].latestValue = goal.value
        acc[key].latestDate = goal.date
        // Обновляем изображение, если оно есть (берем из последней записи)
        if (goal.image) {
          acc[key].image = goal.image
        }
      }

      return acc
    },
    {} as Record<string, GoalGroup>,
  )

  const goalGroups = Object.values(groupedGoals).sort((a, b) => {
    // Сортируем по последней дате (новые сверху)
    return new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
  })

  if (loading) {
    return (
      <section className="stats-section">
        <h2>Цели</h2>
        <div className="stats-placeholder">
          <p>Загрузка целей...</p>
        </div>
      </section>
    )
  }

  if (goalGroups.length === 0) {
    return (
      <section className="stats-section">
        <h2>Цели</h2>
        <div className="stats-placeholder">
          <p>У вас пока нет целей. Добавьте первую цель через форму добавления!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="stats-section">
      <h2>Цели</h2>
      <div className="stats-grid">
        {goalGroups.map((goalGroup, index) => {
          // Получаем URL изображения
          const imageUrl =
            goalGroup.image &&
            typeof goalGroup.image === 'object' &&
            goalGroup.image !== null &&
            'url' in goalGroup.image
              ? goalGroup.image.url
              : null

          const cardStyle: React.CSSProperties = imageUrl
            ? {
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                color: 'white',
                position: 'relative',
                border: 'none',
              }
            : {}

          return (
            <div
              key={`${goalGroup.name}-${index}`}
              className="stat-card"
              style={{ ...cardStyle, cursor: 'pointer' }}
              onClick={() => handleGoalClick(goalGroup)}
            >
              {imageUrl && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      'linear-gradient(135deg, rgb(102 126 234 / 32%) 0%, rgb(118 75 162 / 24%) 100%)',
                    borderRadius: '8px',
                    zIndex: 0,
                  }}
                />
              )}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="stat-value">
                  {goalGroup.latestValue.toLocaleString()}
                  {goalGroup.unit && ` ${goalGroup.unit}`}
                </div>
                <div className="stat-label">{goalGroup.name}</div>
              </div>
            </div>
          )
        })}
      </div>

      <EditGoalModal
        goal={selectedGoal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedGoal(null)
        }}
        onUpdate={() => {
          fetchAllGoals()
        }}
      />
    </section>
  )
}
