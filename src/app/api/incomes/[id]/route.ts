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
      collection: 'incomes',
      id,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting income:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления записи' },
      { status: 500 },
    )
  }
}
