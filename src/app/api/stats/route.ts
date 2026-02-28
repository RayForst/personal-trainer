import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import config from '@/payload.config'

async function checkAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth_token')
    return authToken?.value === 'authenticated'
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config })

    const [
      exercisesRes,
      workoutsRes,
      lastWorkoutRes,
      lastBodyMeasurementsRes,
      lastBodyStateRes,
      lastBodyFatRes,
      debtsRes,
      potentialDebtsRes,
      plannedPaymentsRes,
      desiredExpensesRes,
      incomesRes,
    ] = await Promise.all([
        payload.find({
          collection: 'exercises',
          limit: 0,
        }),
        payload.find({
          collection: 'workouts',
          limit: 10000,
          depth: 2,
          where: {
            isSkip: { not_equals: true },
          },
        }),
        payload.find({
          collection: 'workouts',
          limit: 1,
          sort: '-date',
          where: {
            isSkip: { not_equals: true },
          },
        }),
        payload.find({
          collection: 'body-measurements',
          limit: 1,
          sort: '-date',
        }),
        payload.find({
          collection: 'body-state',
          limit: 1,
          sort: '-date',
        }),
        payload.find({
          collection: 'body-fat',
          limit: 1,
          sort: '-date',
        }),
        payload.find({
          collection: 'debts',
          limit: 10000,
        }),
        payload.find({
          collection: 'potential-debts',
          limit: 10000,
        }),
        payload.find({
          collection: 'planned-payments',
          limit: 10000,
        }),
        payload.find({
          collection: 'desired-expenses',
          limit: 10000,
        }),
        payload.find({
          collection: 'incomes',
          limit: 10000,
        }),
      ])

    let maxWeight = 0
    let totalVolume = 0

    workoutsRes.docs.forEach((workout) => {
      workout.exercises?.forEach((exercise) => {
        if (exercise.exerciseType === 'strength' && exercise.sets) {
          exercise.sets.forEach((set) => {
            const reps = parseInt(String(set.reps || 0)) || 0
            const weight = parseFloat(String(set.weight || 0)) || 0
            if (reps && weight) {
              totalVolume += reps * weight
              maxWeight = Math.max(maxWeight, weight)
            }
          })
        }
      })
    })

    const lastWorkout = lastWorkoutRes.docs[0]
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let daysSinceLastWorkout: number | null = null
    if (lastWorkout?.date) {
      const lastDate = new Date(lastWorkout.date)
      lastDate.setHours(0, 0, 0, 0)
      daysSinceLastWorkout = Math.floor(
        (today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000),
      )
    }

    const lastBody = lastBodyMeasurementsRes.docs[0] as
      | { weight?: number; bodyFat?: number; date?: string }
      | undefined
    const lastBodyState = lastBodyStateRes.docs[0] as
      | { weight: number; date?: string }
      | undefined
    const lastBodyFat = lastBodyFatRes.docs[0] as
      | { value: number; date?: string }
      | undefined

    let currentWeight: number | null = lastBody?.weight ?? null
    let currentBodyFat: number | null = lastBody?.bodyFat ?? null
    if (currentWeight == null && lastBodyState?.weight != null) {
      currentWeight = lastBodyState.weight
    }
    if (currentBodyFat == null && lastBodyFat?.value != null) {
      currentBodyFat = lastBodyFat.value
    }

    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')
    const yearParam = searchParams.get('year')
    const filterByMonth = monthParam != null && yearParam != null
    const filterMonth = monthParam != null ? parseInt(monthParam, 10) : 0
    const filterYear = yearParam != null ? parseInt(yearParam, 10) : 0

    const getMonthsPaid = (startDate: string | null | undefined) => {
      if (!filterByMonth || !startDate) return 0
      const d = new Date(startDate)
      return Math.max(0, (filterYear - d.getFullYear()) * 12 + (filterMonth - (d.getMonth() + 1)))
    }

    const debtActiveInMonth = (d: {
      returnDate?: string | null
      createdAt?: string
      isMonthlyPayment?: boolean
      monthlyAmount?: number | null
      amount?: number
    }) => {
      if (!filterByMonth) return true
      if (d.isMonthlyPayment && d.monthlyAmount != null) {
        const startDate = d.returnDate || d.createdAt
        if (!startDate) return true
        const startD = new Date(startDate)
        const startYear = startD.getFullYear()
        const startMonth = startD.getMonth() + 1
        if (filterYear < startYear || (filterYear === startYear && filterMonth < startMonth))
          return false
        const monthsPaid = getMonthsPaid(startDate)
        const remaining = Math.max(0, (d.amount || 0) - monthsPaid * d.monthlyAmount)
        return remaining > 0
      }
      if (d.returnDate == null) return true
      const date = new Date(d.returnDate)
      const monthStart = new Date(filterYear, filterMonth - 1, 1)
      const monthEnd = new Date(filterYear, filterMonth, 1)
      return date >= monthStart && date < monthEnd
    }

    const getDisplayAmount = (
      d: { amount?: number; isMonthlyPayment?: boolean; monthlyAmount?: number | null },
      monthsPaid: number,
    ) => {
      if (d.isMonthlyPayment && d.monthlyAmount != null) {
        return Math.max(0, (d.amount || 0) - monthsPaid * d.monthlyAmount)
      }
      return d.amount || 0
    }

    const getMonthlyTotal = (
      d: { amount?: number; isMonthlyPayment?: boolean; monthlyAmount?: number | null },
      monthsPaid: number,
    ) => {
      if (d.isMonthlyPayment && d.monthlyAmount != null) {
        const remaining = Math.max(0, (d.amount || 0) - monthsPaid * d.monthlyAmount)
        return Math.min(d.monthlyAmount, remaining)
      }
      return d.amount || 0
    }

    const debts = debtsRes.docs as Array<{
      amount: number
      who?: string
      returnDate?: string | null
      createdAt?: string
      isMonthlyPayment?: boolean
      monthlyAmount?: number | null
    }>
    const filteredDebts = filterByMonth ? debts.filter(debtActiveInMonth) : debts
    const totalDebt = filteredDebts.reduce((sum, d) => {
      const monthsPaid = d.isMonthlyPayment ? getMonthsPaid(d.returnDate || d.createdAt) : 0
      return sum + getDisplayAmount(d, monthsPaid)
    }, 0)
    const monthlyDebtBreakdown = filteredDebts
      .filter((d) => d.isMonthlyPayment && d.monthlyAmount != null)
      .map((d) => {
        const monthsPaid = getMonthsPaid(d.returnDate || d.createdAt)
        const monthlyTotal = getMonthlyTotal(d, monthsPaid)
        return { who: d.who || '—', monthlyAmount: monthlyTotal }
      })
    const monthlyDebt = monthlyDebtBreakdown.reduce((sum, d) => sum + d.monthlyAmount, 0)

    const potentialDebts = potentialDebtsRes.docs as Array<{
      amount: number
      returnDate?: string | null
      createdAt?: string
      isMonthlyPayment?: boolean
      monthlyAmount?: number | null
    }>
    const filteredPotentialDebts = filterByMonth
      ? potentialDebts.filter(debtActiveInMonth)
      : potentialDebts
    const potentialDebtTotal = filteredPotentialDebts.reduce((sum, d) => {
      const monthsPaid = d.isMonthlyPayment ? getMonthsPaid(d.returnDate || d.createdAt) : 0
      return sum + getDisplayAmount(d, monthsPaid)
    }, 0)
    const potentialDebtMonthly = filteredPotentialDebts.reduce((sum, d) => {
      const monthsPaid = d.isMonthlyPayment ? getMonthsPaid(d.returnDate || d.createdAt) : 0
      return sum + getMonthlyTotal(d, monthsPaid)
    }, 0)

    const plannedPayments = plannedPaymentsRes.docs as Array<{ name?: string; amount: number }>
    const plannedPaymentsBreakdown = plannedPayments.map((p) => ({
      name: p.name || '—',
      amount: p.amount || 0,
    }))
    const plannedPaymentsNextMonth = plannedPaymentsBreakdown.reduce(
      (sum, p) => sum + p.amount,
      0,
    )

    const desiredExpenses = desiredExpensesRes.docs as Array<{ amount: number }>
    const desiredExpensesTotal = desiredExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    )

    const incomes = incomesRes.docs as Array<{ amount: number; receiptDate?: string | null }>
    const filteredIncomes = filterByMonth
      ? incomes.filter((i) => {
          if (i.receiptDate == null) return true
          const d = new Date(i.receiptDate)
          return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear
        })
      : incomes
    const monthlyIncome = filteredIncomes.reduce((sum, i) => sum + (i.amount || 0), 0)

    return NextResponse.json({
      exercisesCount: exercisesRes.totalDocs,
      workoutsCount: workoutsRes.totalDocs,
      maxWeight: Math.round(maxWeight * 10) / 10,
      totalVolume: Math.round(totalVolume),
      daysSinceLastWorkout,
      currentWeight,
      currentBodyFat,
      monthlyDebt: Math.round(monthlyDebt * 100) / 100,
      monthlyDebtBreakdown: monthlyDebtBreakdown.map((d) => ({
        who: d.who,
        monthlyAmount: Math.round(d.monthlyAmount * 100) / 100,
      })),
      plannedPaymentsBreakdown: plannedPaymentsBreakdown.map((p) => ({
        name: p.name,
        amount: Math.round(p.amount * 100) / 100,
      })),
      totalDebt: Math.round(totalDebt * 100) / 100,
      potentialDebtTotal: Math.round(potentialDebtTotal * 100) / 100,
      potentialDebtMonthly: Math.round(potentialDebtMonthly * 100) / 100,
      plannedPaymentsNextMonth: Math.round(plannedPaymentsNextMonth * 100) / 100,
      desiredExpensesTotal: Math.round(desiredExpensesTotal * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Ошибка загрузки статистики' },
      { status: 500 },
    )
  }
}
