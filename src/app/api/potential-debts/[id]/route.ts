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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params

  try {
    const payload = await getPayload({ config })
    const body = await request.json()
    const amount = body.amount != null ? Number(body.amount) : null
    const who = typeof body.who === 'string' ? body.who.trim() : ''
    const priority = ['low', 'normal', 'high'].includes(body.priority) ? body.priority : 'normal'
    const returnDate = body.returnDate ?? null
    const isMonthlyPayment = Boolean(body.isMonthlyPayment)
    const monthlyAmount =
      body.monthlyAmount != null && body.monthlyAmount !== ''
        ? Number(body.monthlyAmount)
        : null

    if (amount == null || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Укажите корректную сумму (число больше 0)' },
        { status: 400 },
      )
    }

    if (!who) {
      return NextResponse.json(
        { error: 'Укажите, кто кому должен' },
        { status: 400 },
      )
    }

    if (
      isMonthlyPayment &&
      (monthlyAmount == null || Number.isNaN(monthlyAmount) || monthlyAmount <= 0)
    ) {
      return NextResponse.json(
        { error: 'Укажите корректную сумму ежемесячного платежа' },
        { status: 400 },
      )
    }

    const record = await payload.update({
      collection: 'potential-debts',
      id,
      data: {
        amount: Math.round(amount * 100) / 100,
        who,
        priority,
        returnDate: returnDate || undefined,
        isMonthlyPayment,
        monthlyAmount:
          isMonthlyPayment && monthlyAmount != null
            ? Math.round(monthlyAmount * 100) / 100
            : undefined,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error updating potential debt:', error)
    return NextResponse.json(
      { error: 'Ошибка сохранения записи' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authenticated = await checkAuth()
  if (!authenticated) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }

  const { id } = await params

  try {
    const payload = await getPayload({ config })
    await payload.delete({
      collection: 'potential-debts',
      id,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting potential debt:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления записи' },
      { status: 500 },
    )
  }
}
