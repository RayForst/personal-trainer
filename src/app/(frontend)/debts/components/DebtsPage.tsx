'use client'

import React, { useEffect, useState } from 'react'
import { X, Pencil } from 'lucide-react'
import { showToast } from '@/lib/toast'
import { confirmAction } from '@/app/(frontend)/components/ConfirmDialog'

export type DebtPriority = 'low' | 'normal' | 'high'

export interface DebtRecord {
  id: string
  amount: number
  who: string
  returnDate: string | null
  priority?: DebtPriority
  isMonthlyPayment?: boolean
  monthlyAmount?: number | null
  createdAt: string
  updatedAt: string
}

const DEBT_PRIORITY_ORDER: Record<DebtPriority, number> = { high: 0, normal: 1, low: 2 }
const DEBT_PRIORITY_LABELS: Record<DebtPriority, string> = {
  low: 'Неприоритетный',
  normal: 'Обычный',
  high: 'Важный',
}
const DEBT_PRIORITY_COLORS: Record<DebtPriority, string> = {
  high: 'bg-red-500',
  normal: 'bg-orange-500',
  low: 'bg-gray-400',
}

export type PaymentPriority = 'low' | 'normal' | 'high'

export interface PlannedPaymentRecord {
  id: string
  name: string
  amount: number
  priority?: PaymentPriority
  notes?: string | null
  createdAt: string
  updatedAt: string
}

const PRIORITY_ORDER: Record<PaymentPriority, number> = { high: 0, normal: 1, low: 2 }
const PRIORITY_LABELS: Record<PaymentPriority, string> = {
  low: 'Неприоритетный',
  normal: 'Обычный',
  high: 'Важный',
}
const PRIORITY_COLORS: Record<PaymentPriority, string> = {
  high: 'bg-red-500',
  normal: 'bg-orange-500',
  low: 'bg-gray-400',
}

export interface DesiredExpenseRecord {
  id: string
  name: string
  amount: number
  targetDate: string | null
  priority?: PaymentPriority
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface PotentialDebtRecord {
  id: string
  amount: number
  who: string
  returnDate: string | null
  priority?: DebtPriority
  isMonthlyPayment?: boolean
  monthlyAmount?: number | null
  createdAt: string
  updatedAt: string
}

export interface IncomeRecord {
  id: string
  amount: number
  source: string
  receiptDate: string | null
  createdAt: string
  updatedAt: string
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatAmount(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function DebtsPage() {
  const [records, setRecords] = useState<DebtRecord[]>([])
  const [plannedPayments, setPlannedPayments] = useState<PlannedPaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [who, setWho] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [debtPriority, setDebtPriority] = useState<DebtPriority>('normal')
  const [hasPaymentSchedule, setHasPaymentSchedule] = useState(false)
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ppName, setPpName] = useState('')
  const [ppAmount, setPpAmount] = useState('')
  const [ppNotes, setPpNotes] = useState('')
  const [ppPriority, setPpPriority] = useState<PaymentPriority>('normal')
  const [ppSubmitting, setPpSubmitting] = useState(false)
  const [editingPlannedPaymentId, setEditingPlannedPaymentId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'debts' | 'payments' | 'potential'>('debts')
  const [incomes, setIncomes] = useState<IncomeRecord[]>([])
  const [incAmount, setIncAmount] = useState('')
  const [incSource, setIncSource] = useState('')
  const [incDate, setIncDate] = useState('')
  const [incSubmitting, setIncSubmitting] = useState(false)
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null)
  const [potentialDebts, setPotentialDebts] = useState<PotentialDebtRecord[]>([])
  const [pdAmount, setPdAmount] = useState('')
  const [pdWho, setPdWho] = useState('')
  const [pdReturnDate, setPdReturnDate] = useState('')
  const [pdPriority, setPdPriority] = useState<DebtPriority>('normal')
  const [pdHasPaymentSchedule, setPdHasPaymentSchedule] = useState(false)
  const [pdMonthlyAmount, setPdMonthlyAmount] = useState('')
  const [pdSubmitting, setPdSubmitting] = useState(false)
  const [editingPotentialDebtId, setEditingPotentialDebtId] = useState<string | null>(null)
  const [desiredExpenses, setDesiredExpenses] = useState<DesiredExpenseRecord[]>([])
  const [deName, setDeName] = useState('')
  const [deAmount, setDeAmount] = useState('')
  const [deTargetDate, setDeTargetDate] = useState('')
  const [dePriority, setDePriority] = useState<PaymentPriority>('normal')
  const [deNotes, setDeNotes] = useState('')
  const [deSubmitting, setDeSubmitting] = useState(false)
  const [editingDesiredExpenseId, setEditingDesiredExpenseId] = useState<string | null>(null)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const [debtsRes, ppRes, pdRes, deRes, incomesRes] = await Promise.all([
        fetch('/api/debts'),
        fetch('/api/planned-payments'),
        fetch('/api/potential-debts'),
        fetch('/api/desired-expenses'),
        fetch('/api/incomes'),
      ])
      if (debtsRes.ok) {
        const data = await debtsRes.json()
        setRecords(data.docs || [])
      } else {
        showToast.error('Ошибка загрузки долгов')
      }
      if (ppRes.ok) {
        const data = await ppRes.json()
        setPlannedPayments(data.docs || [])
      } else {
        showToast.error('Ошибка загрузки планируемых платежей')
      }
      if (pdRes.ok) {
        const data = await pdRes.json()
        setPotentialDebts(data.docs || [])
      } else {
        showToast.error('Ошибка загрузки потенциальных долгов')
      }
      if (deRes.ok) {
        const data = await deRes.json()
        setDesiredExpenses(data.docs || [])
      } else {
        showToast.error('Ошибка загрузки желаемых расходов')
      }
      if (incomesRes.ok) {
        const data = await incomesRes.json()
        setIncomes(data.docs || [])
      } else {
        showToast.error('Ошибка загрузки доходов')
      }
    } catch (e) {
      console.error(e)
      showToast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const handleEdit = (r: DebtRecord) => {
    setEditingDebtId(r.id)
    setAmount(String(r.amount))
    setWho(r.who)
    setReturnDate(r.returnDate || '')
    setDebtPriority((r.priority || 'normal') as DebtPriority)
    setHasPaymentSchedule(Boolean(r.isMonthlyPayment))
    setMonthlyAmount(r.monthlyAmount != null ? String(r.monthlyAmount) : '')
  }

  const handleCancelEdit = () => {
    setEditingDebtId(null)
    setAmount('')
    setWho('')
    setReturnDate('')
    setDebtPriority('normal')
    setHasPaymentSchedule(false)
    setMonthlyAmount('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const a = parseFloat(amount.replace(',', '.'))
    if (Number.isNaN(a) || a <= 0) {
      showToast.error('Введите корректную сумму (число больше 0)')
      return
    }
    const whoTrimmed = who.trim()
    if (!whoTrimmed) {
      showToast.error('Укажите, кто кому должен')
      return
    }
    let monthlyVal: number | undefined
    if (hasPaymentSchedule) {
      const m = parseFloat(monthlyAmount.replace(',', '.'))
      if (Number.isNaN(m) || m <= 0) {
        showToast.error('Введите корректную сумму ежемесячного платежа')
        return
      }
      monthlyVal = m
    }
    setSubmitting(true)
    try {
      const body = {
        amount: a,
        who: whoTrimmed,
        returnDate: returnDate || undefined,
        priority: debtPriority,
        isMonthlyPayment: hasPaymentSchedule,
        monthlyAmount: monthlyVal,
      }
      const url = editingDebtId ? `/api/debts/${editingDebtId}` : '/api/debts'
      const method = editingDebtId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        showToast.success(editingDebtId ? 'Долг обновлён' : 'Долг добавлен')
        handleCancelEdit()
        if (editingDebtId) {
          setRecords((prev) =>
            prev.map((r) => (r.id === editingDebtId ? data : r)),
          )
        } else {
          setRecords((prev) => [data, ...prev])
        }
      } else {
        showToast.error(data.error || 'Ошибка сохранения')
      }
    } catch (e) {
      showToast.error('Ошибка сохранения')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirmAction('Удалить эту запись?')
    if (!ok) return
    try {
      const res = await fetch(`/api/debts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast.success('Запись удалена')
        setRecords((prev) => prev.filter((r) => r.id !== id))
      } else {
        showToast.error('Ошибка удаления')
      }
    } catch (e) {
      showToast.error('Ошибка удаления')
    }
  }

  const totalDebt = records.reduce((sum, r) => sum + (r.amount || 0), 0)
  const monthlyDebt = records.reduce((sum, r) => {
    if (r.isMonthlyPayment && r.monthlyAmount != null) return sum + r.monthlyAmount
    return sum
  }, 0)
  const plannedPaymentsTotal = plannedPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  const potentialDebtTotal = potentialDebts.reduce((sum, r) => sum + (r.amount || 0), 0)
  const potentialDebtMonthly = potentialDebts.reduce((sum, r) => {
    if (r.isMonthlyPayment && r.monthlyAmount != null) return sum + r.monthlyAmount
    return sum
  }, 0)
  const desiredExpensesTotal = desiredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const monthlyIncomeTotal = incomes.reduce((sum, i) => sum + (i.amount || 0), 0)

  const handleDesiredExpenseEdit = (e: DesiredExpenseRecord) => {
    setEditingDesiredExpenseId(e.id)
    setDeName(e.name)
    setDeAmount(String(e.amount))
    setDeTargetDate(e.targetDate || '')
    setDePriority((e.priority || 'normal') as PaymentPriority)
    setDeNotes(e.notes || '')
  }

  const handleDesiredExpenseCancelEdit = () => {
    setEditingDesiredExpenseId(null)
    setDeName('')
    setDeAmount('')
    setDeTargetDate('')
    setDePriority('normal')
    setDeNotes('')
  }

  const handleDesiredExpenseSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const nameTrimmed = deName.trim()
    if (!nameTrimmed) {
      showToast.error('Введите название')
      return
    }
    const a = parseFloat(deAmount.replace(',', '.'))
    if (Number.isNaN(a) || a <= 0) {
      showToast.error('Введите корректную сумму')
      return
    }
    setDeSubmitting(true)
    try {
      const body = {
        name: nameTrimmed,
        amount: a,
        targetDate: deTargetDate || undefined,
        priority: dePriority,
        notes: deNotes.trim() || undefined,
      }
      const url = editingDesiredExpenseId
        ? `/api/desired-expenses/${editingDesiredExpenseId}`
        : '/api/desired-expenses'
      const method = editingDesiredExpenseId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        showToast.success(
          editingDesiredExpenseId ? 'Желаемый расход обновлён' : 'Желаемый расход добавлен',
        )
        handleDesiredExpenseCancelEdit()
        if (editingDesiredExpenseId) {
          setDesiredExpenses((prev) =>
            prev.map((e) => (e.id === editingDesiredExpenseId ? data : e)),
          )
        } else {
          setDesiredExpenses((prev) => [data, ...prev])
        }
      } else {
        showToast.error(data.error || 'Ошибка сохранения')
      }
    } catch (e) {
      showToast.error('Ошибка сохранения')
    } finally {
      setDeSubmitting(false)
    }
  }

  const handleDesiredExpenseDelete = async (id: string) => {
    const ok = await confirmAction('Удалить эту запись?')
    if (!ok) return
    try {
      const res = await fetch(`/api/desired-expenses/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast.success('Запись удалена')
        setDesiredExpenses((prev) => prev.filter((e) => e.id !== id))
      } else {
        showToast.error('Ошибка удаления')
      }
    } catch (e) {
      showToast.error('Ошибка удаления')
    }
  }

  const handlePotentialDebtEdit = (r: PotentialDebtRecord) => {
    setEditingPotentialDebtId(r.id)
    setPdAmount(String(r.amount))
    setPdWho(r.who)
    setPdReturnDate(r.returnDate || '')
    setPdPriority((r.priority || 'normal') as DebtPriority)
    setPdHasPaymentSchedule(Boolean(r.isMonthlyPayment))
    setPdMonthlyAmount(r.monthlyAmount != null ? String(r.monthlyAmount) : '')
  }

  const handlePotentialDebtCancelEdit = () => {
    setEditingPotentialDebtId(null)
    setPdAmount('')
    setPdWho('')
    setPdReturnDate('')
    setPdPriority('normal')
    setPdHasPaymentSchedule(false)
    setPdMonthlyAmount('')
  }

  const handlePotentialDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const a = parseFloat(pdAmount.replace(',', '.'))
    if (Number.isNaN(a) || a <= 0) {
      showToast.error('Введите корректную сумму (число больше 0)')
      return
    }
    const whoTrimmed = pdWho.trim()
    if (!whoTrimmed) {
      showToast.error('Укажите, кто кому должен')
      return
    }
    let monthlyVal: number | undefined
    if (pdHasPaymentSchedule) {
      const m = parseFloat(pdMonthlyAmount.replace(',', '.'))
      if (Number.isNaN(m) || m <= 0) {
        showToast.error('Введите корректную сумму ежемесячного платежа')
        return
      }
      monthlyVal = m
    }
    setPdSubmitting(true)
    try {
      const body = {
        amount: a,
        who: whoTrimmed,
        returnDate: pdReturnDate || undefined,
        priority: pdPriority,
        isMonthlyPayment: pdHasPaymentSchedule,
        monthlyAmount: monthlyVal,
      }
      const url = editingPotentialDebtId ? `/api/potential-debts/${editingPotentialDebtId}` : '/api/potential-debts'
      const method = editingPotentialDebtId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        showToast.success(editingPotentialDebtId ? 'Потенциальный долг обновлён' : 'Потенциальный долг добавлен')
        handlePotentialDebtCancelEdit()
        if (editingPotentialDebtId) {
          setPotentialDebts((prev) =>
            prev.map((r) => (r.id === editingPotentialDebtId ? data : r)),
          )
        } else {
          setPotentialDebts((prev) => [data, ...prev])
        }
      } else {
        showToast.error(data.error || 'Ошибка сохранения')
      }
    } catch (e) {
      showToast.error('Ошибка сохранения')
    } finally {
      setPdSubmitting(false)
    }
  }

  const handlePotentialDebtDelete = async (id: string) => {
    const ok = await confirmAction('Удалить эту запись?')
    if (!ok) return
    try {
      const res = await fetch(`/api/potential-debts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast.success('Запись удалена')
        setPotentialDebts((prev) => prev.filter((r) => r.id !== id))
      } else {
        showToast.error('Ошибка удаления')
      }
    } catch (e) {
      showToast.error('Ошибка удаления')
    }
  }

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const a = parseFloat(incAmount.replace(',', '.'))
    if (Number.isNaN(a) || a <= 0) {
      showToast.error('Введите корректную сумму')
      return
    }
    const sourceTrimmed = incSource.trim()
    if (!sourceTrimmed) {
      showToast.error('Укажите источник дохода')
      return
    }
    setIncSubmitting(true)
    try {
      const res = await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: a,
          source: sourceTrimmed,
          receiptDate: incDate || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast.success('Доход добавлен')
        setIncAmount('')
        setIncSource('')
        setIncDate('')
        setIncomes((prev) => [data, ...prev])
      } else {
        showToast.error(data.error || 'Ошибка сохранения')
      }
    } catch (e) {
      showToast.error('Ошибка сохранения')
    } finally {
      setIncSubmitting(false)
    }
  }

  const handleIncomeDelete = async (id: string) => {
    const ok = await confirmAction('Удалить эту запись?')
    if (!ok) return
    try {
      const res = await fetch(`/api/incomes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast.success('Запись удалена')
        setIncomes((prev) => prev.filter((i) => i.id !== id))
      } else {
        showToast.error('Ошибка удаления')
      }
    } catch (e) {
      showToast.error('Ошибка удаления')
    }
  }

  const handlePlannedPaymentEdit = (p: PlannedPaymentRecord) => {
    setEditingPlannedPaymentId(p.id)
    setPpName(p.name)
    setPpAmount(String(p.amount))
    setPpNotes(p.notes || '')
    setPpPriority((p.priority || 'normal') as PaymentPriority)
  }

  const handlePlannedPaymentCancelEdit = () => {
    setEditingPlannedPaymentId(null)
    setPpName('')
    setPpAmount('')
    setPpNotes('')
    setPpPriority('normal')
  }

  const handlePlannedPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameTrimmed = ppName.trim()
    if (!nameTrimmed) {
      showToast.error('Введите название')
      return
    }
    const a = parseFloat(ppAmount.replace(',', '.'))
    if (Number.isNaN(a) || a <= 0) {
      showToast.error('Введите корректную сумму')
      return
    }
    setPpSubmitting(true)
    try {
      const body = {
        name: nameTrimmed,
        amount: a,
        priority: ppPriority,
        notes: ppNotes.trim() || undefined,
      }
      const url = editingPlannedPaymentId
        ? `/api/planned-payments/${editingPlannedPaymentId}`
        : '/api/planned-payments'
      const method = editingPlannedPaymentId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        showToast.success(
          editingPlannedPaymentId ? 'Планируемый платёж обновлён' : 'Планируемый платёж добавлен',
        )
        handlePlannedPaymentCancelEdit()
        if (editingPlannedPaymentId) {
          setPlannedPayments((prev) =>
            prev.map((p) => (p.id === editingPlannedPaymentId ? data : p)),
          )
        } else {
          setPlannedPayments((prev) => [data, ...prev])
        }
      } else {
        showToast.error(data.error || 'Ошибка сохранения')
      }
    } catch (e) {
      showToast.error('Ошибка сохранения')
    } finally {
      setPpSubmitting(false)
    }
  }

  const handlePlannedPaymentDelete = async (id: string) => {
    const ok = await confirmAction('Удалить эту запись?')
    if (!ok) return
    try {
      const res = await fetch(`/api/planned-payments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast.success('Запись удалена')
        setPlannedPayments((prev) => prev.filter((p) => p.id !== id))
      } else {
        showToast.error('Ошибка удаления')
      }
    } catch (e) {
      showToast.error('Ошибка удаления')
    }
  }

  return (
    <div className="triptych-container relative flex w-full h-[calc(100vh-var(--header-height))] mt-[var(--header-height)] overflow-hidden">
      <main className="center-content flex-1 flex flex-row items-start overflow-y-auto min-w-0 w-full transition-[margin] duration-300 ease-in-out p-6 gap-6">
        {/* Форма — слева, 50% ширины */}
        <section className="w-1/2 min-w-0 shrink-0 bg-white rounded-xl p-6 shadow-sm overflow-y-auto">
          <h1 className="m-0 mb-2 text-2xl text-gray-800">Долги и платежи</h1>
          <p className="m-0 mb-6 text-gray-500 text-[0.95rem]">
            Долги: сумма, кто кому должен, дата отдачи. Платежи: подписки и сервисы (не долг, можно отменить).
          </p>

          {/* Табы */}
          <div className="flex gap-1 mb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('debts')}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors -mb-px ${
                activeTab === 'debts'
                  ? 'bg-white border border-gray-200 border-b-white text-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Долги
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors -mb-px ${
                activeTab === 'payments'
                  ? 'bg-white border border-gray-200 border-b-white text-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Платежи
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('potential')}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-md transition-colors -mb-px ${
                activeTab === 'potential'
                  ? 'bg-white border border-gray-200 border-b-white text-gray-800'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Потенциальный долг
            </button>
          </div>

          {activeTab === 'debts' && (
            <>
          <h2 className="mt-0 mb-3 text-[1.15rem] text-gray-800">Добавить долг</h2>
          <form
            className="flex flex-col gap-4 mb-8"
            onSubmit={handleSubmit}
          >
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="debt-amount" className="text-sm font-medium text-gray-600">
                  Сумма (€)
                </label>
                <input
                  id="debt-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[120px]"
                  required
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label htmlFor="debt-who" className="text-sm font-medium text-gray-600">
                  Кто кому должен
                </label>
                <input
                  id="debt-who"
                  type="text"
                  placeholder="Иван мне / Я Маше"
                  value={who}
                  onChange={(e) => setWho(e.target.value)}
                  className="py-2 px-3 border border-gray-200 rounded-md text-base w-full"
                  required
                />
              </div>
              {!hasPaymentSchedule && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="debt-return-date" className="text-sm font-medium text-gray-600">
                    Дата отдачи
                  </label>
                  <input
                    id="debt-return-date"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[140px]"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-600">Приоритетность</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="debt-priority"
                    checked={debtPriority === 'low'}
                    onChange={() => setDebtPriority('low')}
                    className="w-4 h-4"
                  />
                  <span>Неприоритетный</span>
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0 bg-gray-400" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="debt-priority"
                    checked={debtPriority === 'normal'}
                    onChange={() => setDebtPriority('normal')}
                    className="w-4 h-4"
                  />
                  <span>Обычный</span>
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0 bg-orange-500" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="debt-priority"
                    checked={debtPriority === 'high'}
                    onChange={() => setDebtPriority('high')}
                    className="w-4 h-4"
                  />
                  <span>Важный</span>
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0 bg-red-500" />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-600">График платежей</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment-schedule"
                    checked={!hasPaymentSchedule}
                    onChange={() => setHasPaymentSchedule(false)}
                    className="w-4 h-4"
                  />
                  <span>Обычный долг</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payment-schedule"
                    checked={hasPaymentSchedule}
                    onChange={() => setHasPaymentSchedule(true)}
                    className="w-4 h-4"
                  />
                  <span>Долг с ежемесячной оплатой</span>
                </label>
              </div>
              {hasPaymentSchedule && (
                <div className="flex flex-wrap items-end gap-4 mt-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="debt-monthly-amount" className="text-sm font-medium text-gray-600">
                      Ежемесячный платёж (€)
                    </label>
                    <input
                      id="debt-monthly-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="200"
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(e.target.value)}
                      className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[140px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="debt-return-date-monthly" className="text-sm font-medium text-gray-600">
                      Дата отдачи
                    </label>
                    <input
                      id="debt-return-date-monthly"
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[140px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="py-2 px-5 bg-blue-600 text-white border-none rounded-md font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Сохранение…' : editingDebtId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingDebtId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-2 px-4 border border-gray-300 rounded-md text-gray-600 text-sm font-medium cursor-pointer hover:bg-gray-50"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          <div>
            <h3 className="m-0 mb-4 text-base font-semibold text-gray-600">Таблица долгов</h3>
            {loading ? (
              <p className="m-0 text-gray-500">Загрузка…</p>
            ) : records.length === 0 ? (
              <p className="m-0 text-gray-500">Пока нет записей. Добавьте первый долг.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse [&_th]:py-2.5 [&_th]:px-3 [&_th]:text-left [&_th]:border-b [&_th]:border-gray-200 [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:text-sm [&_td]:py-2.5 [&_td]:px-3 [&_td]:border-b [&_td]:border-gray-200 [&_td:last-child]:text-right">
                  <thead>
                    <tr>
                      <th>Сумма</th>
                      <th>Кто кому должен</th>
                      <th>Приоритет</th>
                      <th>Дата отдачи</th>
                      <th>Ежемес. платёж</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...records]
                      .sort(
                        (a, b) =>
                          DEBT_PRIORITY_ORDER[(a.priority || 'normal') as DebtPriority] -
                          DEBT_PRIORITY_ORDER[(b.priority || 'normal') as DebtPriority],
                      )
                      .map((r) => {
                        const p = (r.priority || 'normal') as DebtPriority
                        return (
                      <tr key={r.id}>
                        <td className="font-medium text-red-600">−{formatAmount(r.amount)} €</td>
                        <td>{r.who}</td>
                        <td>
                          <span className="inline-flex items-center gap-1.5">
                            {DEBT_PRIORITY_LABELS[p]}
                            <span
                              className={`inline-block w-3 h-3 rounded-sm shrink-0 ${DEBT_PRIORITY_COLORS[p]}`}
                              title={DEBT_PRIORITY_LABELS[p]}
                            />
                          </span>
                        </td>
                        <td>{formatDate(r.returnDate)}</td>
                        <td>
                          {r.isMonthlyPayment && r.monthlyAmount != null ? (
                            <span className="text-orange-600">{formatAmount(r.monthlyAmount)} €</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <div className="flex gap-0.5 justify-end items-center">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                            onClick={() => handleEdit(r)}
                            title="Редактировать"
                          >
                            <Pencil className="w-5 h-5" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-600 hover:text-red-700 cursor-pointer transition-colors"
                            onClick={() => handleDelete(r.id)}
                            title="Удалить"
                          >
                            <X className="w-6 h-6" strokeWidth={2.5} />
                          </button>
                          </div>
                        </td>
                      </tr>
                      )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          )}

          {activeTab === 'payments' && (
            <>
          <h2 className="mt-0 mb-3 text-[1.15rem] text-gray-800">Планируемые платежи в следующем месяце</h2>
          <p className="m-0 mb-4 text-gray-500 text-sm">
            Подписки, сервисы — то, что вы точно будете платить. Не долг, можно отменить в любой момент.
          </p>
          <form
            className="flex flex-col gap-4 mb-6"
            onSubmit={handlePlannedPaymentSubmit}
          >
            <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="pp-amount" className="text-sm font-medium text-gray-600">
                Сумма в месяц (€)
              </label>
              <input
                id="pp-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="9.99"
                value={ppAmount}
                onChange={(e) => setPpAmount(e.target.value)}
                className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[120px]"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="pp-name" className="text-sm font-medium text-gray-600">
                Название
              </label>
              <input
                id="pp-name"
                type="text"
                placeholder="Spotify, Netflix, спортзал..."
                value={ppName}
                onChange={(e) => setPpName(e.target.value)}
                className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[180px]"
                required
              />
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
              <label htmlFor="pp-notes" className="text-sm font-medium text-gray-600">
                Заметки
              </label>
              <input
                id="pp-notes"
                type="text"
                placeholder="Дата списания, ссылка на отмену..."
                value={ppNotes}
                onChange={(e) => setPpNotes(e.target.value)}
                className="py-2 px-3 border border-gray-200 rounded-md text-base w-full"
              />
            </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-600">Приоритетность</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pp-priority"
                    checked={ppPriority === 'low'}
                    onChange={() => setPpPriority('low')}
                    className="w-4 h-4"
                  />
                  <span>Неприоритетный</span>
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0 bg-gray-400" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pp-priority"
                    checked={ppPriority === 'normal'}
                    onChange={() => setPpPriority('normal')}
                    className="w-4 h-4"
                  />
                  <span>Обычный</span>
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0 bg-orange-500" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pp-priority"
                    checked={ppPriority === 'high'}
                    onChange={() => setPpPriority('high')}
                    className="w-4 h-4"
                  />
                  <span>Важный</span>
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0 bg-red-500" />
                </label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="py-2 px-5 bg-blue-600 text-white border-none rounded-md font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={ppSubmitting}
              >
                {ppSubmitting ? 'Сохранение…' : editingPlannedPaymentId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingPlannedPaymentId && (
                <button
                  type="button"
                  onClick={handlePlannedPaymentCancelEdit}
                  className="py-2 px-4 border border-gray-300 rounded-md text-gray-600 text-sm font-medium cursor-pointer hover:bg-gray-50"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          <div>
            <h3 className="m-0 mb-4 text-base font-semibold text-gray-600">Список планируемых платежей</h3>
            {loading ? (
              <p className="m-0 text-gray-500">Загрузка…</p>
            ) : plannedPayments.length === 0 ? (
              <p className="m-0 text-gray-500">Пока нет записей. Добавьте подписку или сервис.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse [&_th]:py-2.5 [&_th]:px-3 [&_th]:text-left [&_th]:border-b [&_th]:border-gray-200 [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:text-sm [&_td]:py-2.5 [&_td]:px-3 [&_td]:border-b [&_td]:border-gray-200 [&_td:last-child]:text-right">
                  <thead>
                    <tr>
                      <th>Сумма/мес</th>
                      <th>Название</th>
                      <th>Приоритет</th>
                      <th>Заметки</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...plannedPayments]
                      .sort((a, b) => PRIORITY_ORDER[(a.priority || 'normal') as PaymentPriority] - PRIORITY_ORDER[(b.priority || 'normal') as PaymentPriority])
                      .map((p) => (
                      <tr key={p.id}>
                        <td className="font-medium text-red-600">−{formatAmount(p.amount)} €</td>
                        <td>{p.name}</td>
                        <td>
                          <span className="inline-flex items-center gap-1.5">
                            {PRIORITY_LABELS[(p.priority || 'normal') as PaymentPriority]}
                            <span
                              className={`inline-block w-3 h-3 rounded-sm shrink-0 ${PRIORITY_COLORS[(p.priority || 'normal') as PaymentPriority]}`}
                              title={PRIORITY_LABELS[(p.priority || 'normal') as PaymentPriority]}
                            />
                          </span>
                        </td>
                        <td className="text-gray-600">{p.notes || '—'}</td>
                        <td>
                          <div className="flex gap-0.5 justify-end items-center">
                            <button
                              type="button"
                              className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                              onClick={() => handlePlannedPaymentEdit(p)}
                              title="Редактировать"
                            >
                              <Pencil className="w-5 h-5" strokeWidth={2} />
                            </button>
                            <button
                              type="button"
                              className="p-1 text-red-600 hover:text-red-700 cursor-pointer transition-colors"
                              onClick={() => handlePlannedPaymentDelete(p.id)}
                              title="Удалить"
                            >
                              <X className="w-6 h-6" strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          )}

          {activeTab === 'potential' && (
            <>
          <h2 className="mt-0 mb-3 text-[1.15rem] text-gray-800">Потенциальный долг</h2>
          <p className="m-0 mb-4 text-gray-500 text-sm">
            Вещи, которые можно и не платить. Не попадает в общий долг.
          </p>
          <form
            className="flex flex-col gap-4 mb-8"
            onSubmit={handlePotentialDebtSubmit}
          >
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="pd-amount" className="text-sm font-medium text-gray-600">
                  Сумма (€)
                </label>
                <input
                  id="pd-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1000"
                  value={pdAmount}
                  onChange={(e) => setPdAmount(e.target.value)}
                  className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[120px]"
                  required
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                <label htmlFor="pd-who" className="text-sm font-medium text-gray-600">
                  Кто кому должен
                </label>
                <input
                  id="pd-who"
                  type="text"
                  placeholder="Иван мне / Я Маше"
                  value={pdWho}
                  onChange={(e) => setPdWho(e.target.value)}
                  className="py-2 px-3 border border-gray-200 rounded-md text-base w-full"
                  required
                />
              </div>
              {!pdHasPaymentSchedule && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="pd-return-date" className="text-sm font-medium text-gray-600">
                    Дата отдачи
                  </label>
                  <input
                    id="pd-return-date"
                    type="date"
                    value={pdReturnDate}
                    onChange={(e) => setPdReturnDate(e.target.value)}
                    className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[140px]"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-600">Приоритетность</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pd-priority"
                    checked={pdPriority === 'low'}
                    onChange={() => setPdPriority('low')}
                    className="w-4 h-4"
                  />
                  <span>Неприоритетный</span>
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0 bg-gray-400" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pd-priority"
                    checked={pdPriority === 'normal'}
                    onChange={() => setPdPriority('normal')}
                    className="w-4 h-4"
                  />
                  <span>Обычный</span>
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0 bg-orange-500" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pd-priority"
                    checked={pdPriority === 'high'}
                    onChange={() => setPdPriority('high')}
                    className="w-4 h-4"
                  />
                  <span>Важный</span>
                  <span className="inline-block w-3 h-3 rounded-sm shrink-0 bg-red-500" />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-gray-600">График платежей</span>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pd-payment-schedule"
                    checked={!pdHasPaymentSchedule}
                    onChange={() => setPdHasPaymentSchedule(false)}
                    className="w-4 h-4"
                  />
                  <span>Обычный долг</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="pd-payment-schedule"
                    checked={pdHasPaymentSchedule}
                    onChange={() => setPdHasPaymentSchedule(true)}
                    className="w-4 h-4"
                  />
                  <span>Долг с ежемесячной оплатой</span>
                </label>
              </div>
              {pdHasPaymentSchedule && (
                <div className="flex flex-wrap items-end gap-4 mt-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="pd-monthly-amount" className="text-sm font-medium text-gray-600">
                      Ежемесячный платёж (€)
                    </label>
                    <input
                      id="pd-monthly-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="200"
                      value={pdMonthlyAmount}
                      onChange={(e) => setPdMonthlyAmount(e.target.value)}
                      className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[140px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="pd-return-date-monthly" className="text-sm font-medium text-gray-600">
                      Дата отдачи
                    </label>
                    <input
                      id="pd-return-date-monthly"
                      type="date"
                      value={pdReturnDate}
                      onChange={(e) => setPdReturnDate(e.target.value)}
                      className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[140px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="py-2 px-5 bg-blue-600 text-white border-none rounded-md font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={pdSubmitting}
              >
                {pdSubmitting ? 'Сохранение…' : editingPotentialDebtId ? 'Сохранить' : 'Добавить'}
              </button>
              {editingPotentialDebtId && (
                <button
                  type="button"
                  onClick={handlePotentialDebtCancelEdit}
                  className="py-2 px-4 border border-gray-300 rounded-md text-gray-600 text-sm font-medium cursor-pointer hover:bg-gray-50"
                >
                  Отмена
                </button>
              )}
            </div>
          </form>

          <div>
            <h3 className="m-0 mb-4 text-base font-semibold text-gray-600">Таблица потенциальных долгов</h3>
            {loading ? (
              <p className="m-0 text-gray-500">Загрузка…</p>
            ) : potentialDebts.length === 0 ? (
              <p className="m-0 text-gray-500">Пока нет записей. Добавьте первый потенциальный долг.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse [&_th]:py-2.5 [&_th]:px-3 [&_th]:text-left [&_th]:border-b [&_th]:border-gray-200 [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:text-sm [&_td]:py-2.5 [&_td]:px-3 [&_td]:border-b [&_td]:border-gray-200 [&_td:last-child]:text-right">
                  <thead>
                    <tr>
                      <th>Сумма</th>
                      <th>Кто кому должен</th>
                      <th>Приоритет</th>
                      <th>Дата отдачи</th>
                      <th>Ежемес. платёж</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...potentialDebts]
                      .sort(
                        (a, b) =>
                          DEBT_PRIORITY_ORDER[(a.priority || 'normal') as DebtPriority] -
                          DEBT_PRIORITY_ORDER[(b.priority || 'normal') as DebtPriority],
                      )
                      .map((r) => {
                        const p = (r.priority || 'normal') as DebtPriority
                        return (
                      <tr key={r.id}>
                        <td className="font-medium text-red-600">−{formatAmount(r.amount)} €</td>
                        <td>{r.who}</td>
                        <td>
                          <span className="inline-flex items-center gap-1.5">
                            {DEBT_PRIORITY_LABELS[p]}
                            <span
                              className={`inline-block w-3 h-3 rounded-sm shrink-0 ${DEBT_PRIORITY_COLORS[p]}`}
                              title={DEBT_PRIORITY_LABELS[p]}
                            />
                          </span>
                        </td>
                        <td>{formatDate(r.returnDate)}</td>
                        <td>
                          {r.isMonthlyPayment && r.monthlyAmount != null ? (
                            <span className="text-orange-600">{formatAmount(r.monthlyAmount)} €</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <div className="flex gap-0.5 justify-end items-center">
                          <button
                            type="button"
                            className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                            onClick={() => handlePotentialDebtEdit(r)}
                            title="Редактировать"
                          >
                            <Pencil className="w-5 h-5" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className="p-1 text-red-600 hover:text-red-700 cursor-pointer transition-colors"
                            onClick={() => handlePotentialDebtDelete(r.id)}
                            title="Удалить"
                          >
                            <X className="w-6 h-6" strokeWidth={2.5} />
                          </button>
                          </div>
                        </td>
                      </tr>
                      )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
            </>
          )}
        </section>

        {/* Правая колонка: Аналитика + Доход */}
        <aside className="w-1/2 min-w-[280px] shrink-0 self-start flex flex-col gap-6">
          <div className="bg-gray-100 rounded-xl p-6 border border-gray-300">
            <h3 className="m-0 mb-4 text-sm font-semibold text-gray-600">Аналитика</h3>
            <div className="flex flex-row flex-wrap gap-8 items-start">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-500 font-medium">Месячный долг (в т.ч. планируемые)</span>
                <span className="text-[18px] font-bold">
                  <span className="text-red-600">{formatAmount(monthlyDebt)} €</span>
                  {' + '}
                  <span className="text-orange-600">{formatAmount(plannedPaymentsTotal)} €</span>
                  {' = '}
                  <span className="text-red-600">−{formatAmount(monthlyDebt + plannedPaymentsTotal)} €</span>
                </span>
                <span className="text-xs text-gray-500">долги + подписки, сервисы</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-500 font-medium">Планируемый доход в месяц</span>
                <span className="text-[18px] font-bold text-green-600">
                  +{formatAmount(monthlyIncomeTotal)} €
                </span>
                <span className="text-xs text-gray-500">регулярные доходы</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-500 font-medium">Общий долг</span>
                <span className="text-[18px] font-bold text-red-600">
                  −{formatAmount(totalDebt)} €
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-500 font-medium">Потенциальный долг</span>
                <span className="text-[18px] font-bold text-gray-600">
                  −{formatAmount(potentialDebtTotal)} €
                </span>
                <span className="text-xs text-gray-500">можно и не платить</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-gray-500 font-medium">Желаемые расходы</span>
                <span className="text-[18px] font-bold text-gray-600">
                  −{formatAmount(desiredExpensesTotal)} €
                </span>
                <span className="text-xs text-gray-500">хотелось бы потратить</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="m-0 mb-4 text-sm font-semibold text-gray-600">Доход</h3>
            <p className="m-0 mb-4 text-gray-500 text-xs">
              Планируемые доходы — каждый месяц. Укажите день, когда приходит доход.
            </p>
            <form
              className="flex flex-wrap items-end gap-4 mb-6"
              onSubmit={handleIncomeSubmit}
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="inc-amount" className="text-sm font-medium text-gray-600">
                  Сумма (€)
                </label>
                <input
                  id="inc-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="2000"
                  value={incAmount}
                  onChange={(e) => setIncAmount(e.target.value)}
                  className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[120px]"
                  required
                />
              </div>
              <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                <label htmlFor="inc-source" className="text-sm font-medium text-gray-600">
                  Источник дохода
                </label>
                <input
                  id="inc-source"
                  type="text"
                  placeholder="Зарплата, Фриланс..."
                  value={incSource}
                  onChange={(e) => setIncSource(e.target.value)}
                  className="py-2 px-3 border border-gray-200 rounded-md text-base w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="inc-date" className="text-sm font-medium text-gray-600">
                  Дата получения
                </label>
                <input
                  id="inc-date"
                  type="date"
                  value={incDate}
                  onChange={(e) => setIncDate(e.target.value)}
                  className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[140px]"
                />
              </div>
              <button
                type="submit"
                className="py-2 px-5 bg-blue-600 text-white border-none rounded-md font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={incSubmitting}
              >
                {incSubmitting ? 'Сохранение…' : 'Добавить'}
              </button>
            </form>

            <div>
              <h4 className="m-0 mb-3 text-xs font-semibold text-gray-600">Список доходов</h4>
              {loading ? (
                <p className="m-0 text-gray-500 text-sm">Загрузка…</p>
              ) : incomes.length === 0 ? (
                <p className="m-0 text-gray-500 text-sm">Пока нет записей.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse [&_th]:py-2 [&_th]:px-2 [&_th]:text-left [&_th]:border-b [&_th]:border-gray-200 [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:text-xs [&_td]:py-2 [&_td]:px-2 [&_td]:border-b [&_td]:border-gray-200 [&_td:last-child]:text-right">
                    <thead>
                      <tr>
                        <th>Сумма</th>
                        <th>Источник</th>
                        <th>Дата</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomes.map((i) => (
                        <tr key={i.id}>
                          <td className="font-medium text-sm text-green-600">+{formatAmount(i.amount)} €</td>
                          <td className="text-sm">{i.source}</td>
                          <td className="text-sm">{formatDate(i.receiptDate)}</td>
                          <td>
                            <button
                              type="button"
                              className="p-1 text-red-600 hover:text-red-700 cursor-pointer transition-colors"
                              onClick={() => handleIncomeDelete(i.id)}
                              title="Удалить"
                            >
                              <X className="w-6 h-6" strokeWidth={2.5} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="m-0 mb-4 text-sm font-semibold text-gray-600">Желаемые расходы</h3>
            <p className="m-0 mb-4 text-gray-500 text-xs">
              Деньги, которые хотелось бы потратить в будущем. Дата опциональна. Можно прожить и без этого.
            </p>
            <form
              className="flex flex-col gap-4 mb-6"
              onSubmit={handleDesiredExpenseSubmit}
            >
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="de-amount" className="text-sm font-medium text-gray-600">
                    Сумма (€)
                  </label>
                  <input
                    id="de-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="15000"
                    value={deAmount}
                    onChange={(e) => setDeAmount(e.target.value)}
                    className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[100px]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                  <label htmlFor="de-name" className="text-sm font-medium text-gray-600">
                    Название
                  </label>
                  <input
                    id="de-name"
                    type="text"
                    placeholder="Машина, отпуск..."
                    value={deName}
                    onChange={(e) => setDeName(e.target.value)}
                    className="py-2 px-3 border border-gray-200 rounded-md text-base w-full"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="de-target-date" className="text-sm font-medium text-gray-600">
                    Срок (опц.)
                  </label>
                  <input
                    id="de-target-date"
                    type="date"
                    value={deTargetDate}
                    onChange={(e) => setDeTargetDate(e.target.value)}
                    className="py-2 px-3 border border-gray-200 rounded-md text-base min-w-[120px]"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                  <label htmlFor="de-notes" className="text-sm font-medium text-gray-600">
                    Заметки (опц.)
                  </label>
                  <input
                    id="de-notes"
                    type="text"
                    placeholder="..."
                    value={deNotes}
                    onChange={(e) => setDeNotes(e.target.value)}
                    className="py-2 px-3 border border-gray-200 rounded-md text-base w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-600">Приоритет</span>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="de-priority"
                      checked={dePriority === 'low'}
                      onChange={() => setDePriority('low')}
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-sm">Низкий</span>
                    <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0 bg-gray-400" />
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="de-priority"
                      checked={dePriority === 'normal'}
                      onChange={() => setDePriority('normal')}
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-sm">Обычный</span>
                    <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0 bg-orange-500" />
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="de-priority"
                      checked={dePriority === 'high'}
                      onChange={() => setDePriority('high')}
                      className="w-3.5 h-3.5"
                    />
                    <span className="text-sm">Важный</span>
                    <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0 bg-red-500" />
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="py-2 px-5 bg-blue-600 text-white border-none rounded-md font-medium text-sm cursor-pointer transition-colors hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={deSubmitting}
                >
                  {deSubmitting ? 'Сохранение…' : editingDesiredExpenseId ? 'Сохранить' : 'Добавить'}
                </button>
                {editingDesiredExpenseId && (
                  <button
                    type="button"
                    onClick={handleDesiredExpenseCancelEdit}
                    className="py-2 px-4 border border-gray-300 rounded-md text-gray-600 text-sm font-medium cursor-pointer hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                )}
              </div>
            </form>

            <div>
              <h4 className="m-0 mb-3 text-xs font-semibold text-gray-600">Список</h4>
              {loading ? (
                <p className="m-0 text-gray-500 text-sm">Загрузка…</p>
              ) : desiredExpenses.length === 0 ? (
                <p className="m-0 text-gray-500 text-sm">Пока нет записей.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse [&_th]:py-2 [&_th]:px-2 [&_th]:text-left [&_th]:border-b [&_th]:border-gray-200 [&_th]:font-semibold [&_th]:text-gray-600 [&_th]:text-xs [&_td]:py-2 [&_td]:px-2 [&_td]:border-b [&_td]:border-gray-200 [&_td:last-child]:text-right">
                    <thead>
                      <tr>
                        <th>Сумма</th>
                        <th>Название</th>
                        <th>Приоритет</th>
                        <th>Срок</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...desiredExpenses]
                        .sort(
                          (a, b) =>
                            PRIORITY_ORDER[(a.priority || 'normal') as PaymentPriority] -
                            PRIORITY_ORDER[(b.priority || 'normal') as PaymentPriority],
                        )
                        .map((e) => (
                        <tr key={e.id}>
                          <td className="font-medium text-sm text-red-600">−{formatAmount(e.amount)} €</td>
                          <td className="text-sm">{e.name}</td>
                          <td>
                            <span className="inline-flex items-center gap-1">
                              <span
                                className={`inline-block w-2.5 h-2.5 rounded-sm shrink-0 ${PRIORITY_COLORS[(e.priority || 'normal') as PaymentPriority]}`}
                                title={PRIORITY_LABELS[(e.priority || 'normal') as PaymentPriority]}
                              />
                            </span>
                          </td>
                          <td className="text-sm">{formatDate(e.targetDate)}</td>
                          <td>
                            <div className="flex gap-0.5 justify-end items-center">
                              <button
                                type="button"
                                className="p-1 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
                                onClick={() => handleDesiredExpenseEdit(e)}
                                title="Редактировать"
                              >
                                <Pencil className="w-4 h-4" strokeWidth={2} />
                              </button>
                              <button
                                type="button"
                                className="p-1 text-red-600 hover:text-red-700 cursor-pointer transition-colors"
                                onClick={() => handleDesiredExpenseDelete(e.id)}
                                title="Удалить"
                              >
                                <X className="w-5 h-5" strokeWidth={2.5} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
