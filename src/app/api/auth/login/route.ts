import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    const expectedUsername = process.env.AUTH_USERNAME
    const expectedPassword = process.env.AUTH_PASSWORD

    // Проверяем наличие переменных окружения
    if (!expectedUsername || !expectedPassword) {
      return NextResponse.json(
        { error: 'Сервер не настроен для авторизации' },
        { status: 500 },
      )
    }

    // Проверяем учетные данные
    if (username === expectedUsername && password === expectedPassword) {
      // Создаем cookie с токеном авторизации
      const cookieStore = await cookies()
      cookieStore.set('auth_token', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 дней
        path: '/',
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Неверное имя пользователя или пароль' }, { status: 401 })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Ошибка при авторизации' }, { status: 500 })
  }
}

