import type { CollectionConfig } from 'payload'

export const Goals: CollectionConfig = {
  slug: 'goals',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'value', 'unit', 'createdAt'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Название цели',
      admin: {
        description: 'Например: Бросить курить, Научиться прыгать на скакалке',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      label: 'Значение',
      admin: {
        description:
          'Количество, которое вы хотите отследить (например, количество сигарет, секунды прыжков)',
      },
    },
    {
      name: 'unit',
      type: 'text',
      required: false,
      label: 'Единица измерения',
      admin: {
        description: 'Например: сигарет, секунд, раз и т.д.',
        placeholder: 'сигарет',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Заметки',
      admin: {
        description: 'Дополнительные заметки о цели',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Изображение для фона',
      admin: {
        description: 'Изображение, которое будет использоваться как фон карточки цели в статистике',
      },
    },
  ],
}
