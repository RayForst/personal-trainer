import type { CollectionConfig } from 'payload'

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'duration', 'source'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Название курса',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: 'Категория',
      options: [
        { label: 'React', value: 'react' },
        { label: 'Redux', value: 'redux' },
        { label: 'Git', value: 'git' },
        { label: 'UI', value: 'ui' },
        { label: 'Gamedev', value: 'gamedev' },
      ],
    },
    {
      name: 'duration',
      type: 'text',
      required: true,
      label: 'Длительность',
      admin: {
        description: 'Формат H:MM:SS или MM:SS (например: 3:01:07, 29:55)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      label: 'Статус',
      options: [
        { label: 'Завершён', value: 'completed' },
        { label: 'В процессе', value: 'inProgress' },
        { label: 'Запланирован', value: 'planned' },
      ],
      defaultValue: 'planned',
    },
    {
      name: 'source',
      type: 'text',
      required: true,
      label: 'Источник / Автор',
    },
    {
      name: 'link',
      type: 'text',
      label: 'Ссылка',
      admin: {
        description: 'URL на курс (YouTube, и т.д.)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Описание',
    },
    {
      name: 'backgroundImageUrl',
      type: 'text',
      label: 'URL фонового изображения',
      admin: {
        description: 'Внешняя ссылка на картинку (альтернатива загрузке)',
      },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Фоновое изображение',
      admin: {
        description: 'Изображение для фона карточки курса',
      },
    },
    {
      name: 'backgroundGradient',
      type: 'text',
      label: 'CSS градиент',
      admin: {
        description: 'Альтернатива изображению. Например: linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
    },
  ],
}
