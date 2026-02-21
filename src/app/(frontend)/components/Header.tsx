'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'

interface HeaderStats {
  exercisesCount: number
  workoutsCount: number
  maxWeight: number
  totalVolume: number
  daysSinceLastWorkout: number | null
  currentWeight: number | null
  currentBodyFat: number | null
  monthlyDebt: number
  totalDebt: number
  plannedPaymentsNextMonth: number
  monthlyIncome: number
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

  const navBtn =
    'px-5 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-300'
  const navBtnActive =
    'border-green-600 text-green-600 bg-green-50 hover:bg-green-100 hover:border-green-600 hover:text-green-600'

  return (
    <header className="fixed top-0 left-0 right-0 h-[var(--header-height)] bg-white border-b border-gray-200 z-[1000] shadow-sm">
      <div className="max-w-full mx-auto h-full flex items-center justify-between px-6">
        <nav className="flex gap-2">
          <button
            onClick={() => router.push('/')}
            className={`${navBtn} ${pathname === '/' ? navBtnActive : ''}`}
          >
            История
          </button>
          <button
            onClick={() => router.push('/progress')}
            className={`${navBtn} ${pathname === '/progress' ? navBtnActive : ''}`}
          >
            Прогресс
          </button>
          <button
            onClick={() => router.push('/goals')}
            className={`${navBtn} ${pathname === '/goals' ? navBtnActive : ''}`}
          >
            Цели
          </button>
          <button
            onClick={() => router.push('/exercises')}
            className={`${navBtn} ${pathname === '/exercises' ? navBtnActive : ''}`}
          >
            Упражнения
          </button>
          <button
            onClick={() => router.push('/state')}
            className={`${navBtn} ${pathname === '/state' ? navBtnActive : ''}`}
          >
            Моё состояние
          </button>
          <button
            onClick={() => router.push('/debts')}
            className={`${navBtn} ${pathname === '/debts' ? navBtnActive : ''}`}
          >
            Долги и платежи
          </button>
        </nav>
        {stats && (
          <div className="flex items-center gap-5 flex-1 justify-center">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Упражнений:</span>
              <span className="text-[15px] font-bold text-gray-800">{stats.exercisesCount}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Тренировок:</span>
              <span className="text-[15px] font-bold text-gray-800">{stats.workoutsCount}</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Лучший вес:</span>
              <span className="text-[15px] font-bold text-gray-800">{stats.maxWeight} кг</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Общий объём:</span>
              <span className="text-[15px] font-bold text-gray-800">
                {formatVolume(stats.totalVolume)} кг
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Последняя тренировка:</span>
              <span className="text-[15px] font-bold text-gray-800">
                {stats.daysSinceLastWorkout === null
                  ? '—'
                  : stats.daysSinceLastWorkout === 0
                    ? 'сегодня'
                    : stats.daysSinceLastWorkout === 1
                      ? 'вчера'
                      : `${stats.daysSinceLastWorkout} дн. назад`}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Текущий вес:</span>
              <span className="text-[15px] font-bold text-gray-800">
                {stats.currentWeight != null ? stats.currentWeight : '—'}
                {' кг'}
                {stats.currentBodyFat != null ? ` (${stats.currentBodyFat}%)` : ''}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Месячный долг:</span>
              <span className="text-[15px] font-bold text-red-600">
                {((stats.monthlyDebt ?? 0) + (stats.plannedPaymentsNextMonth ?? 0)).toLocaleString('ru-RU', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                €
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Планируемый доход:</span>
              <span className="text-[15px] font-bold text-green-600">
                {(stats.monthlyIncome ?? 0).toLocaleString('ru-RU', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                €
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Общий долг:</span>
              <span className="text-[15px] font-bold text-red-600">
                {(stats.totalDebt ?? 0).toLocaleString('ru-RU', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                €
              </span>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="p-2 rounded border border-gray-300 bg-transparent text-gray-600 cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400"
            title="Выйти"
          >
            <LogOut className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  )
}
