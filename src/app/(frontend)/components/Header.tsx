'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()

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
        </nav>
        <div className="header-actions">
          <button onClick={handleLogout} className="logout-btn" title="Выйти">
            Выход
          </button>
        </div>
      </div>
    </header>
  )
}
