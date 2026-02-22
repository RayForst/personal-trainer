import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
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

export async function GET() {
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

    const lastBodyState = lastBodyStateRes.docs[0] as
      | { weight: number }
      | undefined
    const currentWeight =
      lastBodyState?.weight != null ? lastBodyState.weight : null

    const lastBodyFat = lastBodyFatRes.docs[0] as
      | { value: number }
      | undefined
    const currentBodyFat =
      lastBodyFat?.value != null ? lastBodyFat.value : null

    const debts = debtsRes.docs as Array<{
      amount: number
      isMonthlyPayment?: boolean
      monthlyAmount?: number | null
    }>
    const totalDebt = debts.reduce((sum, d) => sum + (d.amount || 0), 0)
    const monthlyDebt = debts.reduce((sum, d) => {
      if (d.isMonthlyPayment && d.monthlyAmount != null) return sum + d.monthlyAmount
      return sum
    }, 0)

    const potentialDebts = potentialDebtsRes.docs as Array<{
      amount: number
      isMonthlyPayment?: boolean
      monthlyAmount?: number | null
    }>
    const potentialDebtTotal = potentialDebts.reduce((sum, d) => sum + (d.amount || 0), 0)
    const potentialDebtMonthly = potentialDebts.reduce((sum, d) => {
      if (d.isMonthlyPayment && d.monthlyAmount != null) return sum + d.monthlyAmount
      return sum
    }, 0)

    const plannedPayments = plannedPaymentsRes.docs as Array<{ amount: number }>
    const plannedPaymentsNextMonth = plannedPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    )

    const desiredExpenses = desiredExpensesRes.docs as Array<{ amount: number }>
    const desiredExpensesTotal = desiredExpenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0,
    )

    const incomes = incomesRes.docs as Array<{ amount: number }>
    const monthlyIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0)

    return NextResponse.json({
      exercisesCount: exercisesRes.totalDocs,
      workoutsCount: workoutsRes.totalDocs,
      maxWeight: Math.round(maxWeight * 10) / 10,
      totalVolume: Math.round(totalVolume),
      daysSinceLastWorkout,
      currentWeight,
      currentBodyFat,
      monthlyDebt: Math.round(monthlyDebt * 100) / 100,
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
