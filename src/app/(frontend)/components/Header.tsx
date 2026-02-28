'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { LogOut } from 'lucide-react'

const MONTH_NAMES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

interface HeaderStats {
  workoutsCount: number
  daysSinceLastWorkout: number | null
  currentWeight: number | null
  currentBodyFat: number | null
  monthlyDebt: number
  monthlyDebtBreakdown?: Array<{ who: string; monthlyAmount: number }>
  plannedPaymentsBreakdown?: Array<{ name: string; amount: number }>
  totalDebt: number
  plannedPaymentsNextMonth: number
  potentialDebtTotal: number
  desiredExpensesTotal: number
  monthlyIncome: number
}

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [stats, setStats] = useState<HeaderStats | null>(null)

  const monthParam = searchParams.get('month')
  const yearParam = searchParams.get('year')
  const now = new Date()
  const currentMonth = monthParam != null ? parseInt(monthParam, 10) : now.getMonth() + 1
  const currentYear = yearParam != null ? parseInt(yearParam, 10) : now.getFullYear()

  const statsMonth = currentMonth
  const statsYear = currentYear

  useEffect(() => {
    let cancelled = false
    const url = `/api/stats?month=${statsMonth}&year=${statsYear}`
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [statsMonth, statsYear])

  const setMonthYear = useCallback(
    (month: number, year: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('month', String(month))
      params.set('year', String(year))
      router.push(`${pathname}?${params.toString()}`)
    },
    [pathname, router, searchParams],
  )

  const navWithMonth = (path: string) => {
    const params = new URLSearchParams()
    params.set('month', String(currentMonth))
    params.set('year', String(currentYear))
    router.push(`${path}?${params.toString()}`)
  }

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
            onClick={() => navWithMonth('/')}
            className={`${navBtn} ${pathname === '/' ? navBtnActive : ''}`}
          >
            История
          </button>
          <button
            onClick={() => navWithMonth('/goals')}
            className={`${navBtn} ${pathname === '/goals' ? navBtnActive : ''}`}
          >
            Цели
          </button>
          <button
            onClick={() => navWithMonth('/state')}
            className={`${navBtn} ${pathname === '/state' ? navBtnActive : ''}`}
          >
            Моё состояние
          </button>
          <button
            onClick={() => navWithMonth('/debts')}
            className={`${navBtn} ${pathname === '/debts' ? navBtnActive : ''}`}
          >
            Долги и платежи
          </button>
          <button
            onClick={() => navWithMonth('/knowledges')}
            className={`${navBtn} ${pathname === '/knowledges' ? navBtnActive : ''}`}
          >
            Знания
          </button>
        </nav>
        <div className="flex items-center gap-6 flex-1 justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <select
              value={currentMonth}
              onChange={(e) => setMonthYear(parseInt(e.target.value, 10), currentYear)}
              className="py-1.5 px-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer"
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={currentYear}
              onChange={(e) => setMonthYear(currentMonth, parseInt(e.target.value, 10))}
              className="py-1.5 px-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white cursor-pointer"
            >
              {Array.from({ length: 11 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {stats && (
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Тренировок:</span>
              <span className="text-[15px] font-bold text-gray-800">{stats.workoutsCount}</span>
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
            <div className="relative flex flex-col items-center gap-0.5 group">
              <span className="text-[11px] text-gray-500 font-medium">Месячный расход:</span>
              <span className="text-[15px] font-bold text-red-600 cursor-help">
                −{' '}
                {((stats.monthlyDebt ?? 0) + (stats.plannedPaymentsNextMonth ?? 0)).toLocaleString('ru-RU', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                €
              </span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 z-[1100]">
                <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg min-w-[300px] w-max max-h-[240px] overflow-y-auto">
                  <div className="font-medium text-gray-200 mb-1 whitespace-nowrap">Долги (ежемес. платежи):</div>
                  {(stats.monthlyDebtBreakdown?.length ?? 0) > 0 ? (
                    stats.monthlyDebtBreakdown!.map((d, i) => (
                      <div key={i} className="text-gray-300 pl-2 whitespace-nowrap">
                        {d.who}: −{d.monthlyAmount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 pl-2">—</div>
                  )}
                  <div className="font-medium text-gray-200 mt-2 mb-1 whitespace-nowrap">Планируемые платежи:</div>
                  {(stats.plannedPaymentsBreakdown?.length ?? 0) > 0 ? (
                    stats.plannedPaymentsBreakdown!.map((p, i) => (
                      <div key={i} className="text-gray-300 pl-2 whitespace-nowrap">
                        {p.name}: −{p.amount.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 pl-2">—</div>
                  )}
                  <div className="border-t border-gray-600 mt-2 pt-2 font-medium whitespace-nowrap">Итого: −{((stats.monthlyDebt ?? 0) + (stats.plannedPaymentsNextMonth ?? 0)).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Месячный доход:</span>
              <span className="text-[15px] font-bold text-green-600">
                +{' '}
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
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Потенц. долг:</span>
              <span className="text-[15px] font-bold text-gray-600">
                −{(stats.potentialDebtTotal ?? 0).toLocaleString('ru-RU', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                €
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] text-gray-500 font-medium">Желаемые расх.:</span>
              <span className="text-[15px] font-bold text-gray-600">
                −{(stats.desiredExpensesTotal ?? 0).toLocaleString('ru-RU', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                €
              </span>
            </div>
          </div>
          )}
        </div>
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
