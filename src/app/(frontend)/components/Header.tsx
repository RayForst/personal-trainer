'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface HeaderStats {
  exercisesCount: number
  workoutsCount: number
  maxWeight: number
  totalVolume: number
  daysSinceLastWorkout: number | null
  currentWeight: number | null
  currentBodyFat: number | null
}

function formatVolume(n: number): string {
  return n.toLocaleString('ru-RU').replace(/\s/g, ' ')
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const [stats, setStats] = useState<HeaderStats | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  // Проверяем, находимся ли мы на странице логина
  if (pathname === '/login') {
    return null
  }

  return (
    <header className="app-header">
      <div className="header-container">
        <nav className="header-nav">
          <button
            onClick={() => router.push('/')}
            className={`nav-btn ${pathname === '/' ? 'active' : ''}`}
          >
            История
          </button>
          <button
            onClick={() => router.push('/progress')}
            className={`nav-btn ${pathname === '/progress' ? 'active' : ''}`}
          >
            Прогресс
          </button>
          <button
            onClick={() => router.push('/goals')}
            className={`nav-btn ${pathname === '/goals' ? 'active' : ''}`}
          >
            Цели
          </button>
          <button
            onClick={() => router.push('/exercises')}
            className={`nav-btn ${pathname === '/exercises' ? 'active' : ''}`}
          >
            Упражнения
          </button>
          <button
            onClick={() => router.push('/state')}
            className={`nav-btn ${pathname === '/state' ? 'active' : ''}`}
          >
            Моё состояние
          </button>
        </nav>
        {stats && (
          <div className="header-stats">
            <div className="header-stat">
              <span className="header-stat-label">Упражнений:</span>
              <span className="header-stat-value">{stats.exercisesCount}</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-label">Тренировок:</span>
              <span className="header-stat-value">{stats.workoutsCount}</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-label">Лучший вес:</span>
              <span className="header-stat-value">{stats.maxWeight} кг</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-label">Общий объём:</span>
              <span className="header-stat-value">{formatVolume(stats.totalVolume)} кг</span>
            </div>
            <div className="header-stat">
              <span className="header-stat-label">Последняя тренировка:</span>
              <span className="header-stat-value">
                {stats.daysSinceLastWorkout === null
                  ? '—'
                  : stats.daysSinceLastWorkout === 0
                    ? 'сегодня'
                    : stats.daysSinceLastWorkout === 1
                      ? 'вчера'
                      : `${stats.daysSinceLastWorkout} дн. назад`}
              </span>
            </div>
            <div className="header-stat">
              <span className="header-stat-label">Текущий вес:</span>
              <span className="header-stat-value">
                {stats.currentWeight != null ? stats.currentWeight : '—'}
                {' кг'}
                {stats.currentBodyFat != null
                  ? ` (${stats.currentBodyFat}%)`
                  : ''}
              </span>
            </div>
          </div>
        )}
        <div className="header-actions">
          <button onClick={handleLogout} className="logout-btn" title="Выйти">
            Выход
          </button>
        </div>
      </div>
    </header>
  )
}
