'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Pencil, Trash2, Plus } from 'lucide-react'
import { showToast } from '@/lib/toast'
import { confirmAction } from '../../components/ConfirmDialog'
import type { Course } from '@/payload-types'

type CourseStatus = 'completed' | 'inProgress' | 'planned'

const CATEGORY_OPTIONS = [
  { label: 'React', value: 'react' },
  { label: 'Redux', value: 'redux' },
  { label: 'Git', value: 'git' },
  { label: 'UI', value: 'ui' },
  { label: 'Gamedev', value: 'gamedev' },
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
)

const STATUS_OPTIONS = [
  { label: 'Завершён', value: 'completed' },
  { label: 'В процессе', value: 'inProgress' },
  { label: 'Запланирован', value: 'planned' },
]

const STATUS_STYLES: Record<CourseStatus, string> = {
  completed: 'bg-green-500 text-white',
  inProgress: 'bg-blue-500 text-white',
  planned: 'bg-pink-500 text-white',
}

const STATUS_BAR_COLOR: Record<CourseStatus, string> = {
  completed: 'bg-green-500',
  inProgress: 'bg-blue-500',
  planned: 'bg-pink-500',
}

const emptyForm = {
  title: '',
  category: 'react' as Course['category'],
  duration: '',
  status: 'planned' as CourseStatus,
  source: '',
  link: '',
  description: '',
  backgroundImageUrl: '',
  backgroundGradient: '',
}

function parseDurationToSeconds(duration: string): number {
  const parts = duration.trim().split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  if (parts.length === 1) {
    return parts[0]
  }
  return 0
}

function formatTotalTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getBackgroundStyle(course: Course): React.CSSProperties | undefined {
  const bgImage = course.backgroundImage
  const bgImageUrl = course.backgroundImageUrl
  const bgGradient = course.backgroundGradient

  if (bgImage && typeof bgImage === 'object' && bgImage !== null && 'url' in bgImage && bgImage.url) {
    return {
      backgroundImage: `url(${bgImage.url})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  if (bgImageUrl) {
    return {
      backgroundImage: `url(${bgImageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  if (bgGradient) {
    return {
      background: bgGradient,
    }
  }
  return undefined
}

interface KnowledgesPageProps {
  initialCourses?: Course[]
}

export default function KnowledgesPage({ initialCourses = [] }: KnowledgesPageProps) {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>(initialCourses)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const refreshCourses = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    setCourses(initialCourses)
  }, [initialCourses])

  const { groupedByCategory, totalTime, totalCount } = useMemo(() => {
    const groups: Record<string, Course[]> = {}
    let totalSeconds = 0

    for (const course of courses) {
      const cat = course.category || 'other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(course)
      totalSeconds += parseDurationToSeconds(course.duration)
    }

    const order = ['react', 'redux', 'git', 'ui', 'gamedev']
    const sorted = order
      .filter((c) => groups[c]?.length)
      .map((c) => ({ category: c, items: groups[c] }))

    return {
      groupedByCategory: sorted,
      totalTime: formatTotalTime(totalSeconds),
      totalCount: courses.length,
    }
  }, [courses])

  const openCreateModal = () => {
    setEditingCourse(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEditModal = (course: Course, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingCourse(course)
    setForm({
      title: course.title,
      category: course.category,
      duration: course.duration,
      status: course.status,
      source: course.source,
      link: course.link || '',
      description: course.description || '',
      backgroundImageUrl: course.backgroundImageUrl || '',
      backgroundGradient: course.backgroundGradient || '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCourse(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      showToast.error('Введите название курса')
      return
    }
    if (!form.duration.trim()) {
      showToast.error('Введите длительность')
      return
    }
    if (!form.source.trim()) {
      showToast.error('Введите источник')
      return
    }

    setSaving(true)
    try {
      const url = editingCourse ? `/api/courses/${editingCourse.id}` : '/api/courses'
      const method = editingCourse ? 'PUT' : 'POST'
      const body = {
        ...form,
        link: form.link || null,
        description: form.description || null,
        backgroundImageUrl: form.backgroundImageUrl || null,
        backgroundGradient: form.backgroundGradient || null,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to save')

      showToast.success(editingCourse ? 'Курс обновлён' : 'Курс добавлен')
      closeModal()
      refreshCourses()
    } catch {
      showToast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (course: Course, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const confirmed = await confirmAction(`Удалить курс "${course.title}"?`)
    if (!confirmed) return

    try {
      const res = await fetch(`/api/courses/${course.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      showToast.success('Курс удалён')
      refreshCourses()
    } catch {
      showToast.error('Ошибка удаления')
    }
  }

  useEffect(() => {
    if (!showModal) return
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showModal])

  return (
    <div className="triptych-container relative flex w-full h-[calc(100vh-var(--header-height))] mt-[var(--header-height)] overflow-hidden">
      {/* Сайдбар — Опыт работы с библиотеками */}
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Опыт работы с библиотеками
          </h2>
          <ul className="list-none space-y-2.5 text-gray-700 text-sm">
            <li>
              <strong className="font-semibold text-gray-800">react-transition-group</strong>
              <span className="block text-gray-500 text-xs mt-0.5">Управление анимациями</span>
            </li>
            <li>
              <strong className="font-semibold text-gray-800">redux</strong>
              <span className="block text-gray-500 text-xs mt-0.5">Глобальное хранилище</span>
            </li>
            <li>
              <strong className="font-semibold text-gray-800">redux-devtools-extension</strong>
              <span className="block text-gray-500 text-xs mt-0.5">Девтулс в хроме</span>
            </li>
            <li>
              <strong className="font-semibold text-gray-800">redux-thunk</strong>
              <span className="block text-gray-500 text-xs mt-0.5">
                Асинхронные операции с хранилищем
              </span>
            </li>
            <li>
              <strong className="font-semibold text-gray-800">redux-saga</strong>
              <span className="block text-gray-500 text-xs mt-0.5">
                Асинхронные операции с хранилищем на основе генераторов
              </span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Основной контент — Выполненные курсы */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0 bg-[var(--color-bg)]">
        <div className="p-6">
          <div className="flex justify-between items-start gap-4 flex-wrap mb-6">
            <h1 className="text-2xl font-bold text-gray-800 m-0">Выполненные курсы</h1>
            <div className="flex items-center gap-3">
              {!loading && (
                <span className="text-sm text-gray-600">
                  Общее время: {totalTime} Количество курсов: {totalCount}
                </span>
              )}
              <button
                onClick={openCreateModal}
                className="border border-green-600 text-green-600 px-4 py-2 rounded text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-green-600 hover:text-white"
              >
                <Plus className="w-4 h-4 inline-block mr-1.5 align-middle" />
                Добавить курс
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-gray-500 py-12">Загрузка...</div>
          ) : (
            <div className="flex flex-col gap-8">
              {groupedByCategory.map(({ category, items }) => (
                <section key={category}>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    {CATEGORY_LABELS[category] || category}
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-2 -mx-1">
                    {items.map((course) => {
                      const bgStyle = getBackgroundStyle(course)
                      const cardContent = (
                        <>
                          {/* Цветная полоска сверху */}
                          <div className={`h-1 shrink-0 ${STATUS_BAR_COLOR[course.status]}`} />
                          {/* Область с возможным фоном */}
                          <div
                            className="relative min-h-[120px] flex flex-col"
                            style={bgStyle}
                          >
                            {bgStyle && (
                              <div
                                className="absolute inset-0 bg-black/15"
                                aria-hidden
                              />
                            )}
                            {/* Верхняя полоска: длительность + статус + кнопки */}
                            <div className="relative flex justify-between items-center px-3 py-2 gap-2">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${
                                  bgStyle ? 'bg-blue-900/80 text-white' : 'text-gray-600'
                                }`}
                              >
                                {course.duration}
                              </span>
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-[10px] font-medium px-2 py-0.5 rounded shrink-0 ${STATUS_STYLES[course.status]}`}
                                >
                                  {course.status}
                                </span>
                                <button
                                  onClick={(e) => openEditModal(course, e)}
                                  className="w-6 h-6 rounded flex items-center justify-center bg-white/20 hover:bg-white/40 text-gray-700 transition-colors shrink-0"
                                  title="Редактировать"
                                >
                                  <Pencil size={12} strokeWidth={2} />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(course, e)}
                                  className="w-6 h-6 rounded flex items-center justify-center bg-white/20 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0"
                                  title="Удалить"
                                >
                                  <Trash2 size={12} strokeWidth={2} />
                                </button>
                              </div>
                            </div>
                            {/* Контент карточки */}
                            <div className="relative flex-1 p-4 flex flex-col">
                              <p
                                className={`text-sm leading-snug mb-3 flex-1 ${
                                  bgStyle ? 'text-gray-900 drop-shadow-sm' : 'text-gray-800'
                                }`}
                              >
                                {course.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Play
                                  className="w-4 h-4 text-red-500 shrink-0"
                                  fill="currentColor"
                                />
                                <span>{course.source}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )
                      const cardClass =
                        'w-72 shrink-0 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow'
                      return course.link ? (
                        <a
                          key={course.id}
                          href={course.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${cardClass} no-underline text-inherit relative`}
                        >
                          {cardContent}
                        </a>
                      ) : (
                        <div key={course.id} className={cardClass}>
                          {cardContent}
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Модалка добавления / редактирования */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0">
              <h2 className="m-0 text-gray-800 text-xl">
                {editingCourse ? 'Редактировать курс' : 'Добавить курс'}
              </h2>
              <button
                type="button"
                className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 border-none cursor-pointer flex items-center justify-center text-xl leading-none hover:bg-gray-300 transition-colors shrink-0"
                onClick={closeModal}
              >
                ×
              </button>
            </div>
            <form className="p-6 flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-600 text-sm">Название *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Название курса"
                  className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-600"
                  required
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-600 text-sm">Категория</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as Course['category'] })
                    }
                    className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-600"
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-semibold text-gray-600 text-sm">Длительность *</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="3:01:07 или 29:55"
                    className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-600 text-sm">Статус</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as CourseStatus })
                  }
                  className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-600"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-600 text-sm">Источник / Автор *</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="Ulbi TV, Design Course..."
                  className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-600 text-sm">Ссылка</label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://..."
                  className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-600 text-sm">Описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Заметки о курсе..."
                  rows={2}
                  className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-600 text-sm">
                  URL фонового изображения
                </label>
                <input
                  type="url"
                  value={form.backgroundImageUrl}
                  onChange={(e) => setForm({ ...form, backgroundImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-600"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-semibold text-gray-600 text-sm">
                  CSS градиент (опционально)
                </label>
                <input
                  type="text"
                  value={form.backgroundGradient}
                  onChange={(e) => setForm({ ...form, backgroundGradient: e.target.value })}
                  placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  className="py-2.5 px-3 border-2 border-gray-200 rounded-lg text-base focus:outline-none focus:border-blue-600 font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="py-2.5 px-5 bg-gray-200 text-gray-700 rounded-lg font-medium cursor-pointer hover:bg-gray-300 transition-colors"
                  onClick={closeModal}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-green-600 text-white rounded-lg font-medium cursor-pointer hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  disabled={saving}
                >
                  {saving ? 'Сохранение...' : editingCourse ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
